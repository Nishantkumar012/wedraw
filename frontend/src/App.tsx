import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Board from "./Board";
import Rooms from "./pages/Rooms";
// import About from "./pages/About";
// import Contact from "./pages/Contact";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/signin" element={<Signin/>}/>
      {/* <Route path="/about" element={<About />} /> */}
      {/* <Route path="/contact" element={<Contact />} /> */}
      // should be boards
      <Route path="/rooms" element={<Rooms/>}/>
      <Route path="/room/:boardId" element={<Board/>}/>
    </Routes>
  );
}

export default App;




// import { useEffect, useRef, useState } from "react";
// import connectWS, { sendWS } from "./ws";
// import type { BoardElement } from "./types";
// import { fetchElements } from "./api";

// const TOKEN =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Njk2YjdjYi1lNGVjLTRkZGEtYTc4Zi1hMGZjOGRhY2NhMDIiLCJpYXQiOjE3NjczNzI1MDQsImV4cCI6MTc2Nzk3NzMwNH0.qgTbwBNKlhDD90Qtvv5U_8JYI5JiaZuxGnIr-Lmeb_M";

// const BOARD_ID = "96825e49-575c-4585-ba8a-5b82807a8b41";


// type Shape = {
//   id: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   isTemp?: boolean
// };

// function App() {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

//   const shapesRef = useRef<Shape[]>([]);
//   // const isDrawingRef = useRef(false);

//   const modeRef = useRef<"idle" | "drawing" | "dragging">("idle")
//   const startRef = useRef({ x: 0, y: 0 });

//   const draggingIdRef = useRef<string | null>(null);
//   const dragOffsetRef = useRef({ x: 0, y: 0 });

// // const activeShapeRef = useState<string | 

// // const justCreatedRef = useRef<string |null>(null);


//   const [joined, setJoined] = useState(false);

//   /* 🔌 WebSocket */
//   useEffect(() => {
//     connectWS(TOKEN, (msg: any) => {
//       if (msg.action === "element_added") {
//         const el = msg.element;
        
           
//         const existingIndex = shapesRef.current.findIndex(s =>
//             Math.abs(s.x - el.data.x)<1 &&
//             Math.abs(s.y - el.data.y)<1 &&
//             Math.abs(s.width - el.data.width)<1 &&
//             Math.abs(s.height - el.data.height)<1 
//           )
            
//          const newShape = {
//               id: el.id,
//               x: el.data.x,
//               y: el.data.y,
//               width: el.data.width,
//               height: el.data.height
//          }

//         // shapesRef.current.push({
//         //   id: el.id,
//         //   x: el.data.x,
//         //   y: el.data.y,
//         //   width: el.data.width,
//         //   height: el.data.height,
//         // });

//           if (existingIndex !== -1) {
//         shapesRef.current[existingIndex] = newShape;
//       } else {
//         shapesRef.current.push(newShape);
//       }

//         // the current shape
//         // justCreatedRef.current = el.id;
//         redraw();
//       }
//     });
//   }, []);

//   /* 🎨 Canvas init + resize */
//   useEffect(() => {
//     const canvas = canvasRef.current!;
//     ctxRef.current = canvas.getContext("2d")!;

//     const resize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//       redraw();
//     };

//     window.addEventListener("resize", resize);
//     resize();

//     return () => window.removeEventListener("resize", resize);
//   }, []);


//   // to check inside shape pr not

//   const isInsideShape = (x:number,y:number,s:Shape)=>{
         
//           return (
//               x >= s.x && x<= (s.x+s.width) &&
//               y >= s.y && y<= (s.y+s.height)
//           )
//   }



//   /* 🔁 Redraw */
//   const redraw = () => {
//     const ctx = ctxRef.current;
//     if (!ctx) return;

//     ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

//     ctx.fillStyle = "#ffffff";
//     ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

//     // grid
//     ctx.strokeStyle = "#f0f0f0";
//     ctx.lineWidth = 1;
//     for (let i = 0; i < window.innerWidth; i += 50) {
//       ctx.beginPath();
//       ctx.moveTo(i, 0);
//       ctx.lineTo(i, window.innerHeight);
//       ctx.stroke();
//     }
//     for (let i = 0; i < window.innerHeight; i += 50) {
//       ctx.beginPath();
//       ctx.moveTo(0, i);
//       ctx.lineTo(window.innerWidth, i);
//       ctx.stroke();
//     }

//     // shapes
//     ctx.strokeStyle = "blue";
//     ctx.lineWidth = 2;
//     shapesRef.current.forEach((s) => {
//       ctx.strokeRect(s.x, s.y, s.width, s.height);
//     });
//   };

//   /* 🧩 Join board */
//   const joinBoard = async() => {
//     if (joined) return;

//     sendWS({
//       action: "join_board",
//       boardId: BOARD_ID,
//     });

//     // setJoined(true);
     
//     //fetch existing shapes
//     try { 
//       const elements = await fetchElements(BOARD_ID,TOKEN);

//         shapesRef.current = [];

//         for(const el of elements){
//              shapesRef.current.push({
//                 id: el.id,
//                 x: el.data.x,
//                 y: el.data.y,
//                 width: el.data.width,
//                 height: el.data.height
                 
//              })

//                redraw();
//     setJoined(true);

//     console.log(joined);
            
//         }
      
//     } catch (error) {
//          console.log("failed to load board",error)
//     }
//   };

//   /* 📍 Mouse position */
//   const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const rect = canvasRef.current!.getBoundingClientRect();
//     return {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     };
//   };

//   const bringToFront =  (id:string)=>{
       
//       const idx = shapesRef.current.findIndex(s => s.id === id);

//       if(idx === -1) return ;

//       const picked = shapesRef.current[idx];

//       shapesRef.current = [
//          ...shapesRef.current.slice(0,idx),
//          ...shapesRef.current.slice(idx+1),
//          { ...picked},
//       ]
//   }

//   /* 🖱️ Mouse Down */
//   const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (!joined) return;

//       //  justCreatedRef.current = null;
       
//     const { x, y } = getMousePos(e);

//     // checking existing shape drag
//     for(let i=shapesRef.current.length-1; i>=0; i--){
//          const s =shapesRef.current[i];
//          if(isInsideShape(x,y,s)){
             
            
//           // if(s.id === justCreatedRef.current) return;
//               modeRef.current = "dragging";
//              draggingIdRef.current = s.id;
//              dragOffsetRef.current = {
//                  x: x - s.x,
//                  y: y- s.y
//              };


//           bringToFront(s.id)
//        redraw();
//       console.log("moderef mouse up pe :::"+" ", modeRef.current)

//              return;
//          }
//     }


//     // for drawing shape
//     modeRef.current = "drawing";
//     startRef.current = { x, y };
//   };

//   /* 🖱️ Mouse Move (preview) */
//   const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
//             const { x, y } = getMousePos(e); 
   
//      //shapes dragging
//      if(modeRef.current == "dragging"){
//          const s = shapesRef.current.find(sh => sh.id === draggingIdRef.current);

//          if(!s) return;

//          s.x = x- dragOffsetRef.current.x;
//          s.y = y - dragOffsetRef.current.y;

//          redraw();
//       console.log("moderef mouse up pe :::"+" ", modeRef.current)

//          return;
//      }


//      // shapes drawing       
//      if (modeRef.current=== "drawing"){
       
//        redraw();
       
       
       
//        const { x: startX, y: startY } = startRef.current;
       
//        const ctx = ctxRef.current!;
//        ctx.strokeStyle = "red";
//        ctx.setLineDash([6, 6]);
       
//        ctx.strokeRect(
//          Math.min(startX, x),
//          Math.min(startY, y),
//          Math.abs(startX - x),
//          Math.abs(startY - y)
//         );
        
//         ctx.setLineDash([]);
//       console.log("moderef mouse up pe :::"+" ", modeRef.current)
//       // return

//       } 
//   };

//   /* 🖱️ Mouse Up */
//   // const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
     
//   //   const { x: endX, y: endY } = getMousePos(e);
     
//   //   // shapes dragging (stop drag)
//   //   if(draggingIdRef.current){
        
//   //       const s = shapesRef.current.find(sh => sh.id === draggingIdRef.current);
         
//   //       if(!s) return ;
//   //        draggingIdRef.current = null;
          
//   //         sendWS({
//   //            action: "element_updated",
//   //            boardId:BOARD_ID,
//   //            elementId: s.id,
//   //            data: {
//   //               x: s.x,
//   //               y: s.y,
//   //               width: s.width,
//   //               height: s.height,
//   //            },
//   //         });
//   //       //  draggingIdRef.current = null;
//   //      return;   
//   //   }
    
//   //   // shapes drawing
//   //   if (!isDrawingRef.current) return;
//   //   isDrawingRef.current = false;

//   //   const { x: startX, y: startY } = startRef.current;

//   //   const x = Math.min(startX, endX);
//   //   const y = Math.min(startY, endY);
//   //   const width = Math.abs(endX - startX);
//   //   const height = Math.abs(endY - startY);

//   //   if (width < 5 || height < 5) {
//   //     redraw();
//   //     return;
//   //   }

//   //   // const shape: Shape = {
//   //   //   id: crypto.randomUUID(),
//   //   //   x,
//   //   //   y,
//   //   //   width,
//   //   //   height,
//   //   // };

//   //   // // optimistic render
//   //   // shapesRef.current.push(shape);
//   //   // redraw();

//   //   // send to backend
//   //   sendWS({
//   //     action: "element_add",
//   //     boardId: BOARD_ID,
//   //     element: {
//   //       type: "RECTANGLE",
//   //       data: { x, y, width, height },
//   //     },
//   //   });
//   // };




// const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
//   const { x: endX, y: endY } = getMousePos(e);

//   /* 🖐️ FINISH DRAG */
//   if (modeRef.current === "dragging") {
//     const s = shapesRef.current.find(sh => sh.id === draggingIdRef.current);
//     draggingIdRef.current = null;
//     modeRef.current = "idle";

//     if (!s) return;

//     sendWS({
//       action: "element_updated",
//       boardId: BOARD_ID,
//       elementId: s.id,
//       data: {
//         x: s.x,
//         y: s.y,
//         width: s.width,
//         height: s.height,
//       },
//     });
//       console.log("moderef mouse up pe :::"+" ", modeRef.current)

//     return;
//   }

//   /* ✏️ FINISH DRAW */
//   if (modeRef.current === "drawing") {
//     modeRef.current = "idle";
//     console.log("hello")

//     const { x: startX, y: startY } = startRef.current;

//     const x = Math.min(startX, endX);
//     const y = Math.min(startY, endY);
//     const width = Math.abs(endX - startX);
//     const height = Math.abs(endY - startY);

//     if (width < 5 || height < 5) {
//       redraw();
//       console.log("moderef mouse up pe :::"+" ", modeRef.current)
//       return;
//     }


//       const tempId = crypto.randomUUID();
//       const newShape: Shape = { id: tempId, x, y, width, height };

//       shapesRef.current.push(newShape);
//       bringToFront(tempId);
//       redraw();

//     sendWS({
//       action: "element_add",
//       boardId: BOARD_ID,
//       element: {
//         type: "RECTANGLE",
//         data: { x, y, width, height },
//       },
//     });
//     // return;
//   }
// };

  
//   const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
//   const { x: endX, y: endY } = getMousePos(e);

//   // ✏️ FINISH DRAWING FIRST
//   if (modeRef.current === "dragging") {
//     // isDrawingRef.current = false;

//     const { x: startX, y: startY } = startRef.current;
//     const x = Math.min(startX, endX);
//     const y = Math.min(startY, endY);
//     const width = Math.abs(endX - startX);
//     const height = Math.abs(endY - startY);

//     if (width < 5 || height < 5) {
//       redraw();
//       return;
//     }

//     sendWS({
//       action: "element_add",
//       boardId: BOARD_ID,
//       element: {
//         type: "RECTANGLE",
//         data: { x, y, width, height },
//       },
//     });
       
//     // // unlock drags
//     //  setTimeout(()=>{
//     //      justCreatedRef.current =null;
//     //  }, 0)
//     return;
//   }

//   // 🖐️ FINISH DRAG
//   if (modeRef.current === "drawing") {

//        modeRef.current = "idle"
//     const s = shapesRef.current.find(sh => sh.id === draggingIdRef.current);
//     if (!s) return;

//     draggingIdRef.current = null;

//     sendWS({
//       action: "element_updated",
//       boardId: BOARD_ID,
//       elementId: s.id,
//       data: {
//         x: s.x,
//         y: s.y,
//         width: s.width,
//         height: s.height,
//       },
//     });
//   }
// };


