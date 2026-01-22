

let ws: WebSocket | null =null;


export default function connectWs(token: string, onMessage: (data: any) => void){
     
   const WS_URL = import.meta.env.DEV
  ? `ws://localhost:3000?token=${token}`
  : "wss://wedraw-f0f7.onrender.com";

//    ws = new WebSocket(`ws://localhost:3000?token=${token}`);

     ws = new WebSocket(WS_URL);
   ws.onopen = () =>{
       console.log("✅ WS connected");
   }


   ws.onmessage = (event) =>{
        
        const data = JSON.parse(event.data);
         console.log("📨 WS message:", data);
         onMessage(data);
   };
   

    ws.onclose = () =>{
         console.log("❌ WS disconnected");
    };

    ws.onerror = (err) => {
         console.error("Ws error", err);
    };

    return ws;
}



export function sendWS(data: any){
     if(ws && ws.readyState === WebSocket.OPEN){
         ws.send(JSON.stringify(data));
     }
}