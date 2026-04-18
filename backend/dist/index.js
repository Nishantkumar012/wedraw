import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "./lib/prisma.js";
import { app } from "./app";
const PORT = 3000;
// boardId → connected sockets
const rooms = new Map();
async function start() {
    try {
        await prisma.$connect();
        console.log("📦 Database connected");
        const httpServer = http.createServer(app);
        const wss = new WebSocketServer({ server: httpServer });
        wss.on("connection", async (ws, req) => {
            console.log("🔌 WebSocket connected");
            // ─────────────────────────────────────────
            // 🔐 AUTH
            // ─────────────────────────────────────────
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                let token = url.searchParams.get("token");
                // if(!token && process.env.NODE_ENV === "production"){
                //        const cookies = req.headers.cookie;
                //        token = cookies
                //       ?.split("; ")
                //       .find(c => c.startsWith("token="))
                //       ?.split("=")[1] ?? null;
                //           }
                //      // cookie vala for production
                //      const cookies = req.headers.cookie;
                //        if (!cookies && process.env.NODE_ENV === "development") {
                //   console.log("⚠️ WS connected without cookie (dev mode)");
                //   return;
                // }
                //      if(!cookies){
                //        ws.close();
                //       return;
                //      }
                //        const token = cookies
                //   .split("; ")
                //   .find(c => c.startsWith("token="))
                //   ?.split("=")[1];
                if (!token) {
                    ws.close();
                    console.log("❌ WS rejected: no token");
                    return;
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                ws.userId = decoded.userId;
                console.log("🔐 Auth OK:", ws.userId);
            }
            catch {
                ws.close();
                console.log("❌ WS rejected: invalid token");
                return;
            }
            // ─────────────────────────────────────────
            // 📩 MESSAGE HANDLER
            // ─────────────────────────────────────────
            ws.on("message", async (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    // ─────────────────────────────────────
                    // 🧩 JOIN BOARD
                    // ─────────────────────────────────────
                    if (msg.action === "join_board") {
                        const { boardId } = msg;
                        if (!boardId)
                            return;
                        if (ws.boardId === boardId)
                            return;
                        const permission = await prisma.permission.findFirst({
                            where: { userId: ws.userId, boardId },
                        });
                        console.log("WS USER:", ws.userId);
                        console.log("BOARD:", boardId);
                        console.log("permission", permission);
                        if (!permission) {
                            console.log("🚫 Access denied:", boardId);
                            return;
                        }
                        ws.boardId = boardId;
                        if (!rooms.has(boardId)) {
                            rooms.set(boardId, new Set());
                        }
                        rooms.get(boardId).add(ws);
                        console.log(`👤 ${ws.userId} joined board ${boardId}`);
                        // notify others
                        for (const client of rooms.get(boardId)) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    action: "user_joined",
                                    userId: ws.userId,
                                    boardId,
                                }));
                            }
                        }
                    }
                    // ─────────────────────────────────────
                    // 🧱 ADD ELEMENT
                    // ─────────────────────────────────────
                    if (msg.action === "element_add") {
                        const { boardId, element } = msg;
                        if (!boardId || !element?.data)
                            return;
                        const permission = await prisma.permission.findFirst({
                            where: { userId: ws.userId, boardId },
                        });
                        if (!permission)
                            return;
                        const created = await prisma.element.create({
                            data: {
                                boardId,
                                type: element.type.toUpperCase(),
                                data: element.data,
                            },
                        });
                        console.log("🧱 Element created:", created.id);
                        const room = rooms.get(boardId);
                        if (!room)
                            return;
                        for (const client of room) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    action: "element_added",
                                    element: {
                                        // this was hidden
                                        id: created.id,
                                        boardId: created.boardId,
                                        type: created.type,
                                        data: created.data,
                                    },
                                }));
                            }
                        }
                    }
                    // ─────────────────────────────────────
                    // 🔄 UPDATE ELEMENT
                    // ─────────────────────────────────────
                    if (msg.action === "element_updated") {
                        // console.log("Elment updated",msg)
                        const { boardId, elementId, data } = msg;
                        if (!boardId || !elementId || !data)
                            return;
                        const permission = await prisma.permission.findFirst({
                            where: { userId: ws.userId, boardId },
                        });
                        if (!permission)
                            return;
                        const updated = await prisma.element.update({
                            where: { id: elementId },
                            data: { data: data },
                        });
                        const room = rooms.get(boardId);
                        if (!room)
                            return;
                        for (const client of room) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    action: "element_updated",
                                    elementId: updated.id,
                                    data: updated.data,
                                }));
                            }
                        }
                    }
                    // _____________________________________
                    if (msg.action === "element_dragging") {
                        const { boardId, elementId, data } = msg;
                        if (!boardId || !elementId || !data)
                            return;
                        const permission = await prisma.permission.findFirst({
                            where: {
                                userId: ws.userId,
                                boardId
                            }
                        });
                        if (!permission)
                            return;
                        const room = rooms.get(boardId);
                        if (!room)
                            return;
                        for (const client of room) {
                            // 🔥 sender ko wapas mat bhejo
                            if (client === ws)
                                continue;
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    action: "element_dragging",
                                    elementId,
                                    data
                                }));
                            }
                        }
                    }
                    // _____________________________________
                }
                catch (err) {
                    console.error("❌ WS message error:", err);
                }
            });
            // ─────────────────────────────────────────
            // ❌ DISCONNECT
            // ─────────────────────────────────────────
            ws.on("close", () => {
                console.log("🔴 WebSocket disconnected");
                const boardId = ws.boardId;
                if (!boardId)
                    return;
                const room = rooms.get(boardId);
                if (!room)
                    return;
                room.delete(ws);
                if (room.size === 0)
                    rooms.delete(boardId);
            });
        });
        httpServer.listen(PORT, "0.0.0.0", () => {
            // console.log(process.env.DATABASE_URL)
            console.log(`🚀 Server + WS running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server", err);
        process.exit(1);
    }
}
start();
// import "dotenv/config";
// import { app } from "./app.js";
// import type { WebSocket } from "ws";
// import { prisma } from "./lib/prisma.js";
// import http from "http";
// import { WebSocketServer } from "ws";
// import jwt from "jsonwebtoken";
// const PORT = 3000;
// // Extend WebSocket type
// declare module "ws" {
//   interface WebSocket {
//     userId?: string;
//     boardId?: string;
//   }
// }
// // boardId → Set of sockets
// const rooms = new Map<string, Set<WebSocket>>();
// async function start() {
//   try {
//     await prisma.$connect();
//     console.log("📦 Database connected!");
//     const httpServer = http.createServer(app);
//     const wss = new WebSocketServer({ server: httpServer });
//     wss.on("connection", async (ws, req) => {
//       console.log("🔌 WebSocket client connected");
//       //
//       // 🔒 AUTH: extract JWT from WebSocket URL
//       //
//       try {
//         const url = new URL(req.url!, `http://${req.headers.host}`);
//         const token = url.searchParams.get("token");
//         if (!token) {
//           ws.close();
//           return console.log("❌ WS rejected: No token");
//         }
//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
//         ws.userId = decoded.userId;
//         console.log("🔐 Auth OK:", ws.userId);
//       } catch (err) {
//         ws.close();
//         return console.log("❌ Invalid token");
//       }
//       //
//       // 📩 Handle incoming messages
//       //
//       ws.on("message", async (message) => {
//         try {
//           const data = JSON.parse(message.toString());
//           //
//           // 🧩 JOIN BOARD
//           //
//           if (data.action === "join_board") {
//             const { boardId } = data;
//             if (!boardId) return;
//             //avoid duplicate joining
//             if(ws.boardId === boardId){
//               return;
//             }
//             // verify access in DB
//             const permission = await prisma.permission.findFirst({
//               where: { userId: ws.userId, boardId }
//             });
//             if (!permission) {
//               console.log("🚫 Access denied: board", boardId);
//               return;
//             }
//             ws.boardId = boardId;
//             if (!rooms.has(boardId)) rooms.set(boardId, new Set());
//             const room = rooms.get(boardId)!;
//             room.add(ws);
//             console.log(`👤 ${ws.userId} joined board: ${boardId}`);
//             // notify others
//             for (const client of room) {
//               // if (client !== ws && client.readyState === client.OPEN) {
//                 if( client.readyState === client.OPEN) {
//                 client.send(JSON.stringify({
//                   action: "user_joined",
//                   userId: ws.userId,
//                   boardId
//                 }));
//               }
//             }
//           }
//           //
//           // 📝 ADD ELEMENT
//           //
//           if (data.action === "element_add") {
//             const { boardId, element } = data;
//             if (!boardId || !element) return;
//             // verify permission
//             const permission = await prisma.permission.findFirst({
//               where: { userId: ws.userId, boardId }
//             });
//             if (!permission) return;
//             // save to DB
//             const created = await prisma.element.create({
//               data: {
//                 boardId,
//                 type: element.type,
//                 data: element.data
//               }
//             });
//             console.log("🧱 Element Created:", created.id);
//             // broadcast to everyone else
//             const room = rooms.get(boardId);
//             if (!room) return;
//             for (const client of room) {
//               // if (client !== ws && client.readyState === client.OPEN) {
//                 if(client.readyState === client.OPEN) { 
//                 // if(client.readyState === client.OPEN){ 
//                 // client.send(JSON.stringify({
//                 //   action: "element_added",
//                 //   element: created
//                 // }));
//                 client.send(JSON.stringify({
//   action: "element_added",
//   element: {
//     id: created.id,
//     type: created.type,
//     data: created.data,   // 👈 explicitly include
//     boardId: created.boardId
//   }
// }));
//               }
//             }
//           }
//            // element created
//            if(data.action === "element_update"){
//                const {boardId,elementId,data: newData} = data;
//                  if(!boardId || !elementId || !newData) return;
//                  const room = rooms.get(boardId);
//                  if(!room) return;
//                  for(const client of room){
//                     // if(client !== ws && client.readyState === client.OPEN){
//                         if( client.readyState === client.OPEN) { 
//                         client.send(JSON.stringify({
//                             action: "element_updated",
//                             elementId,
//                             data: newData
//                          }))
//                     }
//                  }
//            }
//         } catch (err) {
//           console.error("❌ WS message error:", err);
//         }
//       });
//       //
//       // ❌ DISCONNECT
//       //
//       ws.on("close", () => {
//         console.log("🔴 WebSocket disconnected");
//         const boardId = ws.boardId;
//         if (!boardId) return;
//         const room = rooms.get(boardId);
//         if (!room) return;
//         room.delete(ws);
//         if (room.size === 0) rooms.delete(boardId);
//       });
//     });
//     httpServer.listen(PORT, () => {
//       console.log(`🚀 Server + WebSockets running at http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Failed to start server", err);
//     process.exit(1);
//   }
// }
// start();
//# sourceMappingURL=index.js.map