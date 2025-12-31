

let ws: WebSocket | null =null;


export default function connectWs(token: string, onMessage: (data: any) => void){
     
   ws = new WebSocket(`ws://localhost:3000?token=${token}`);

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