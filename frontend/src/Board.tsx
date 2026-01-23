
import { useEffect, useRef, useState} from "react";
import connectWS, { sendWS } from "./ws";
import { fetchElements } from "./api";
import {type PencilStroke, type ElementType} from "./types.ts";

import { useParams } from "react-router-dom";

// joe
// const TOKEN ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Njk2YjdjYi1lNGVjLTRkZGEtYTc4Zi1hMGZjOGRhY2NhMDIiLCJpYXQiOjE3Njg5MTA1MTJ9.8tqhdajgxNEB0VZmdG6N_3ILHqM922YfD_Ugnzlfcts";


    const TOKEN = localStorage.getItem('token') as string;

    console.log("token in board.jsx",  TOKEN )

// const BOARD_ID = "96825e49-575c-4585-ba8a-5b82807a8b41";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

// Added optional isTemp flag
type Shape = {
  id: string;
  type:ElementType
  x: number;
  y: number;
  width: number;
  height: number;
  isTemp?: boolean; // ← temporary optimistic shape marker
};



function Board() {
  
    const [showInviteModal, setShowInviteModal] = useState(false);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState("EDITOR");
const [inviting, setInviting] = useState(false);
 
 const {boardId} = useParams<{boardId: string}>();

 const BOARD_ID = boardId as string;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const shapesRef = useRef<Shape[]>([]);

  const modeRef = useRef<"idle" | "drawing" | "dragging">("idle");
  const startRef = useRef({ x: 0, y: 0 });

  const draggingIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const lastDragSentRef = useRef(0);

  const pencilStrokeRef = useRef<PencilStroke[]>([]);
  const currentStrokeRef = useRef<PencilStroke | null>(null);

  const [tool, setTool] = useState<ElementType>("RECTANGLE");
  const toolRef = useRef<ElementType>("RECTANGLE");
  const [joined, setJoined] = useState(false);



 
const inviteUser = async()=>{
      
       if(! inviteEmail.trim()){
          alert("Email is required");
          return;
       }

       try {
            
          setInviting(true);

            const res = await fetch(
                `${BACKEND}/boards/${boardId}/invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${TOKEN}`,
                    },
                    body: JSON.stringify({
                         email: inviteEmail,
                         role: inviteRole
                    }),
                }
            );
             if (!res.ok) throw new Error("Failed to invite user");

    alert("Invite sent ✉️");

    setInviteEmail("");
    setInviteRole("EDITOR");
    setShowInviteModal(false);


       } catch (error:any) {
          alert(error.message || "Error inviting user");

       }finally{
           setInviting(false);
       }
}




  /* WebSocket - Handle element_added */
  useEffect(() => {
    connectWS(TOKEN, (msg: any) => {
      if (msg.action === "element_added") {
        const el = msg.element;
        // console.log(msg.action);
         
        if(el.type === "PENCIL"){
            
            pencilStrokeRef.current.push({
              id: el.id,
              type: "PENCIL",
              points: el.data.points,
            });
            redraw();
            return;
        }


        console.log("el is:", el);
        const newShape: Shape = {
          id: el.id,
          type: el.type,
          x: el.data.x,
          y: el.data.y,
          width: el.data.width,
          height: el.data.height,
        };

        // Look for a temporary shape (our optimistic one)
        const tempIndex = shapesRef.current.findIndex((s) => s.isTemp);

        if (tempIndex !== -1) {
          // Replace the temporary shape with the real one
          shapesRef.current[tempIndex] = newShape;
          // Bring real shape to front (maintain z-order)
          bringToFront(el.id);
        } else {
          // Shape added by another user → just add it
          shapesRef.current.push(newShape);
          bringToFront(el.id);
        }

        redraw();
      }


      if(msg.action === "element_dragging"){
              // console.log
            //  const el = msg;
            shapesRef.current = shapesRef.current.map((s)=>
             s.id === msg.elementId
            ? { ...s,
          x: msg.data.x,
          y: msg.data.y}
            : s);

            redraw()
      }


       //was error
        if(msg.action === "element_updated"){
             const el = msg.element;

             shapesRef.current = shapesRef.current.map((s) =>
                 
               s.id == el.id
               ?{...s, ...msg.data}
               :s
            )
            redraw();
        }
    });
  }, []);

  /* Canvas init + resize */
  useEffect(() => {
    const canvas = canvasRef.current!;
    ctxRef.current = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };

    window.addEventListener("resize", resize);
    resize();

    return () => window.removeEventListener("resize", resize);
  }, []);


  const isInsideShape = (x: number, y: number, s: Shape) => {
    return x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
  };

  /* Redraw everything */
  const redraw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Grid
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i < window.innerWidth; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, window.innerHeight);
      ctx.stroke();
    }
    for (let i = 0; i < window.innerHeight; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(window.innerWidth, i);
      ctx.stroke();
    }

    // Shapes
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    shapesRef.current.forEach((s) => {
      // ctx.strokeRect(s.x, s.y, s.width, s.height);
      drawShape(ctx,s)
    });


    pencilStrokeRef.current.forEach((stroke)=>{
         drawPencilStroke(ctx, stroke);
    })

    if(currentStrokeRef.current){
         drawPencilStroke(ctx, currentStrokeRef.current);
    }


    
      
  };

  /* Join board & load existing elements */
  const joinBoard = async () => {
    if (joined) return;

    sendWS({
      action: "join_board",
      boardId: BOARD_ID,
    });

    try {
      const elements = await fetchElements(BOARD_ID, TOKEN);
      
      //   elements.forEach((el:any) => {
            
      //        if(el.type === "PENCIL"){
      //            pencilStrokeRef.current.push({
      //              id: el.id,
      //              type: "PENCIL",
      //              points: el.data.points,
      //            })
      //        } else{
              
      //        }
      //   });
      // shapesRef.current = elements.map((el: any) => ({
      //   id: el.id,
      //   type:el.type,
      //   x: el.data.x,
      //   y: el.data.y,
      //   width: el.data.width,
      //   height: el.data.height,
      // }));

         
         shapesRef.current = [];
pencilStrokeRef.current = [];

elements.forEach((el: any) => {
  if (el.type === "PENCIL"  && Array.isArray(el.data?.points)) {
    pencilStrokeRef.current.push({
      id: el.id,
      type: "PENCIL",
      points: el.data.points,
    });
  } else {
    shapesRef.current.push({
      id: el.id,
      type: el.type,
      x: el.data.x,
      y: el.data.y,
      width: el.data.width,
      height: el.data.height,
    });
  }
});

      redraw();
      setJoined(true);
    } catch (error) {
      console.log("failed to load board", error);
    }
  };


  /* Mouse position helper */
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  /* Bring shape to front (z-index) */
  const bringToFront = (id: string) => {
    const idx = shapesRef.current.findIndex((s) => s.id === id);
    if (idx === -1) return;

    const picked = shapesRef.current[idx];
    shapesRef.current = [
      ...shapesRef.current.slice(0, idx),
      ...shapesRef.current.slice(idx + 1),
      { ...picked },
    ];
  };

  
  // for dragging real time users
   
     const sendDraggingWs = (s: Shape) =>{
          
         const now = Date.now();
            // 40ms throttle
          if(now - lastDragSentRef.current < 40) return ;

          lastDragSentRef.current = now;

          sendWS({
              action: "element_dragging",
              boardId: BOARD_ID,
              elementId: s.id,
              data: {
                x: s.x,
                y: s.y
              }
          })
     }



  /* Mouse Down */
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!joined) return;

    const { x, y } = getMousePos(e);

    
    if(toolRef.current === "PENCIL"){
        modeRef.current = "drawing";
        currentStrokeRef.current = {
              id: crypto.randomUUID(),
              type: "PENCIL",
              points: [{x,y}]
        };
        return;

    }


    // Check if clicking on an existing shape (from top to bottom)
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const s = shapesRef.current[i];
      if (isInsideShape(x, y, s)) {
        modeRef.current = "dragging";
        draggingIdRef.current = s.id;
        dragOffsetRef.current = { x: x - s.x, y: y - s.y };

        bringToFront(s.id);
        redraw();
        return;
      }
    }

    // No shape clicked → start drawing
    modeRef.current = "drawing";
    startRef.current = { x, y };
  };

  /* Mouse Move */
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);


    // if(modeRef.current === "drawing" &&
    //    toolRef.current === "PENCIL" &&
    //    currentStrokeRef.current
    // ){
    //     currentStrokeRef.current.points.push({x,y});
    //     redraw();
    //     return;
    // }

    if (
  modeRef.current === "drawing" &&
  toolRef.current === "PENCIL" &&
  currentStrokeRef.current
) {
  currentStrokeRef.current.points.push({ x, y });
  redraw();
  return;
}


//     if (
//   modeRef.current === "drawing" &&
//   toolRef.current === "PENCIL" &&
//   currentStrokeRef.current
// ) {
//   const stroke = currentStrokeRef.current;

//   pencilStrokeRef.current.push(stroke);
//   currentStrokeRef.current = null;
//   modeRef.current = "idle";
//   redraw();

//   sendWS({
//     action: "pencil_add",
//     boardId: BOARD_ID,
//     elements: {
//       type: "PENCIL",
//       data: {
//         points: stroke.points
//       }
//     }
   
//   });

//   return;
// }


    if (modeRef.current === "dragging") {
      const s = shapesRef.current.find((sh) => sh.id === draggingIdRef.current);
      if (!s) return;

      s.x = x - dragOffsetRef.current.x;
      s.y = y - dragOffsetRef.current.y;


      redraw();
      sendDraggingWs(s); 
      return;
    }

    if (modeRef.current === "drawing") {
      redraw(); // clear previous preview

      const { x: startX, y: startY } = startRef.current;
      const ctx = ctxRef.current!;
      ctx.strokeStyle = "red";
      ctx.setLineDash([6, 6]);

      if(toolRef.current === "RECTANGLE"){

        ctx.strokeRect(
          Math.min(startX, x),
          Math.min(startY, y),
          Math.abs(startX - x),
          Math.abs(startY - y)
        );
      }else if(toolRef.current === "CIRCLE"){
          const rx = Math.abs(startX -x)/2;
          const ry = Math.abs(startY - y)/2;
          const cx = Math.min(startX, x) +rx;
          const cy = Math.min(startY, y) + ry;

          ctx.beginPath();
          ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
          ctx.stroke()
      }
      ctx.setLineDash([]);
    }
  };

  /* Mouse Up - Finalize drag or draw */
  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: endX, y: endY } = getMousePos(e);

     // PENCIL      
      if(modeRef.current === "drawing" && toolRef.current === "PENCIL" && currentStrokeRef.current){
            
             const stroke = currentStrokeRef.current;
            pencilStrokeRef.current.push(stroke);
            currentStrokeRef.current =null;
            modeRef.current = "idle";
            redraw();

             sendWS({
                 action: "element_add",
                 boardId: BOARD_ID,
                 element: {
                   type: "PENCIL",
                   data: {
                     points: stroke.points
                   }
                 }
             })

            // currentStrokeRef.current = null;

             
            return;
      }



    /* Finish dragging */
    if (modeRef.current === "dragging") {
      const s = shapesRef.current.find((sh) => sh.id === draggingIdRef.current);
      draggingIdRef.current = null;
      modeRef.current = "idle";

      if (!s) return;

      sendWS({
        action: "element_updated",
        boardId: BOARD_ID,
        elementId: s.id,
        data: {
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        },
      });
  const t = shapesRef.current.length - 1;
        
      console.log(shapesRef.current[t])
      return;
    }

    /* Finish drawing */
    if (modeRef.current === "drawing") {
      modeRef.current = "idle";

      const { x: startX, y: startY } = startRef.current;

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (width < 5 || height < 5) {
        redraw();
        return;
      }

      // Optimistic add with temporary flag
      const tempId = crypto.randomUUID();
      const newShape: Shape = {
        id: tempId,
        type: toolRef.current,
        x,
        y,
        width,
        height,
        isTemp: true, // ← important flag
      };

      shapesRef.current.push(newShape);
      bringToFront(tempId);
      redraw();

      // Send to backend
      sendWS({
        action: "element_add",
        boardId: BOARD_ID,
        element: {
          type: toolRef.current,
          data: { x, y, width, height },
        },
      });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      {/* Join */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={joinBoard}
          className={`px-5 py-2 rounded ${
            joined ? "bg-green-200 text-green-700" : "bg-blue-600 text-white"
          }`}
        
        >
          {joined ? "Connected" : "Join Board"}
          {/* {{console.log(joined)}} */}
        </button>
      </div>
        
           <div className="fixed top-3 left-[400px] z-10 flex gap-2 rounded-lg bg-white px-3 py-2 shadow-md">
            <button
              onClick={() => {
                  
                setTool("RECTANGLE")
                toolRef.current = "RECTANGLE"}}
              className={`cursor-pointer rounded-md border px-3 py-1.5
                ${
                  tool === "RECTANGLE"
                    ? "bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
            >
              ▭ Rect
            </button>

            <button
              onClick={() => {
                
                setTool("CIRCLE")
                toolRef.current = "CIRCLE"}}
              className={`cursor-pointer rounded-md border px-3 py-1.5
                ${
                  tool === "CIRCLE"
                    ? "bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
            >
              ◯ Circle
            </button>

                        <button
              onClick={() => {
                setTool("PENCIL");
                toolRef.current = "PENCIL";
              }}
              className={`cursor-pointer rounded-md border px-3 py-1.5
                ${
                  tool === "PENCIL"
                    ? "bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
            >
              ✏️ Pencil
            </button>

          </div>
                
        <div className="absolute top-4 right-4 z-10">
             <button
             onClick={() => setShowInviteModal(true)}
             className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow-md hover:bg-purple-700"
             >
               👤 Invite User
             </button>
        </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="absolute inset-0 cursor-crosshair"
      />

      {showInviteModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
             <div className="w-96 rounded-2xl bg-white p-6 shadow-2xl">
               
               <h2 className="mb-4 text-xl font-bold text-slate-900">
                  ✉️ Invite user
               </h2>
               
               <input
                 type="email"
                 placeholder="User email"
                 value={inviteEmail}
                 onChange={(e)=> setInviteEmail(e.target.value)}
                 className="mb-3 w-full rounded-xl border p-2 focus:outline-none focus:ring-purple-400"
               />

               <select
                 value={inviteRole}
                 onChange={(e)=> setInviteRole(e.target.value)}
                 className="mb-4 w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                 <option value="EDITOR">Editor</option>
                 <option value="VIEWER">Viewer</option>
                 <option value="OWNER">Owner</option> 
               </select>
                <div className="flex justify-end gap-2">
                        <button
                        onClick={() => {
                            setShowInviteModal(false);
                            setInviteEmail("");
                            setInviteRole("EDITOR");
                        }}
                        className="rounded-xl bg-slate-200 px-4 py-2 hover:bg-slate-300"
                        >
                        Cancel
                        </button>

                        <button
                        onClick={inviteUser}
                        disabled={inviting}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                        {inviting ? "Inviting..." : "Send Invite"}
                        </button>
                </div>
             </div>
            </div>
      )}
    </div>
  );
}
export default Board;





 const drawRect =(
    ctx: CanvasRenderingContext2D,
    s: Shape
   )=>{
       
     ctx.strokeRect(s.x,s.y,s.width,s.height);
  }

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    s: Shape
  )=>{
     
    const cx = s.x + s.width/2;
    const cy = s.y + s.height/2;
    const rx = s.width/2;
    const ry = s.height/2;

     ctx.beginPath();
     ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI * 2);
     ctx.stroke();
  }

  const drawShape=(
    ctx: CanvasRenderingContext2D,
    s: Shape
  )=>{
       switch (s.type) {
         case "RECTANGLE":
          drawRect(ctx,s);
          break;
          case "CIRCLE":
            drawCircle(ctx,s);
            break;
       }
  }


  const drawPencilStroke = (
    ctx: CanvasRenderingContext2D,
    stroke: PencilStroke
  ) => {
      
      //  const pts = stroke.points;

      //  if(pts.length <2) return;

      if (!stroke?.points || stroke.points.length < 2) return;

  const pts = stroke.points;

       ctx.beginPath();
       ctx.moveTo(pts[0].x,pts[0].y);

       for(let i=1; i<pts.length; i++){
          ctx.lineTo(pts[i].x, pts[i].y);
       }

       ctx.stroke();


  }

