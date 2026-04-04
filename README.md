🚀 Collaborative Whiteboard (Real-Time)

A scalable, real-time collaborative whiteboard built with modern web technologies — supporting multi-user interaction, live syncing, and seamless drawing experience.

🌟 Live Demo

🔗 Coming Soon
📹 Demo GIF / Screenshots can be added here

🧠 Overview

This project is a real-time collaborative whiteboard system where multiple users can join a board and interact simultaneously. It is designed with a scalable architecture, focusing on low-latency communication, conflict-free updates, and clean state management.

✨ Key Highlights
⚡ Real-time multi-user collaboration
🔐 Secure authentication (JWT + Guest access)
🎯 Smooth dragging & drawing experience
🧩 Conflict-free ID handling (frontend + backend sync)
🧠 Optimized state management using Zustand
🔄 WebSocket-based event-driven architecture
🛠️ Tech Stack
Layer	Technology
Frontend	React, TypeScript, Canvas API
State Mgmt	Zustand
Backend	Node.js, Express
Realtime	WebSockets (ws / socket.io)
Database	PostgreSQL
ORM	Prisma
🏗️ Architecture
Client (React + Canvas)
        ↓
   WebSocket Layer
        ↓
Backend (Node + Express)
        ↓
   Prisma ORM
        ↓
   PostgreSQL DB
⚙️ Core Features
🔐 Authentication System
User login/signup
JWT-based authentication
Guest users with temporary access tokens
🧾 Board System
Create & manage boards
Persistent board storage
Join existing boards
🎨 Whiteboard Engine
Draw shapes (rectangles, circles, etc.)
Drag & reposition elements
Smooth rendering using Canvas API
⚡ Real-Time Collaboration
Event-based WebSocket communication
Broadcast updates to all connected users
Low latency syncing
🔄 Data Flow (Important 🚨)
🖌️ Drawing / Dragging Flow
User Action → WebSocket Event → Backend Validation → Broadcast → UI Update


📂 Project Structure
whiteboard-app/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── store/        # Zustand stores
│   ├── hooks/
│   └── utils/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── websocket/
│   ├── services/
│   └── prisma/
│
└── README.md
⚡ Getting Started
1️⃣ Clone Repository
git clone https://github.com/your-username/whiteboard-app.git
cd whiteboard-app
2️⃣ Backend Setup
cd backend
npm install
npx prisma migrate dev
npm run dev
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
🔐 Environment Variables
Backend .env
DATABASE_URL=your_db_url
JWT_SECRET=your_secret
PORT=5000
🚀 Performance Considerations
Minimized unnecessary re-renders using Zustand
Efficient WebSocket event handling
Optimized drag updates (throttling/debouncing possible)
Scalable backend architecture
🧪 Future Enhancements
⏪ Undo / Redo system
📤 Export board as image / PDF
👥 Role-based access control
🌐 Multi-board real-time switching
📱 Mobile responsiveness
⚡ CRDT / OT for advanced conflict resolution
🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create your branch (feature/amazing-feature)
3. Commit your changes
4. Push to branch
5. Open a Pull Request
🧑‍💻 Author

Nishant (you 💪)
Building scalable systems & real-time apps 🚀

📜 License

MIT License

💬 Final Note

This project demonstrates:

Real-time system design
WebSocket architecture
Frontend-backend synchronization
Clean and scalable coding practices

If you want next level upgrade 👇
I can add:

📸 Screenshots + GIF demo
🧠 System design diagram (interview ready)
🏆 Resume bullet points from this project
⭐ GitHub badges (stars, forks, tech badges)
