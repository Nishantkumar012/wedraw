# 🚀 Collaborative Whiteboard (Real-Time)

A scalable, real-time collaborative whiteboard application where multiple users can draw, edit, and interact on shared boards seamlessly.

---

## 🌟 Overview

This project is a real-time collaborative system designed for low-latency interaction and smooth user experience. It supports multiple users working on the same board simultaneously using WebSockets.

---

## ✨ Key Highlights

- Real-time multi-user collaboration
- Secure authentication (JWT + Guest access)
- Smooth dragging and drawing experience
- Conflict-free ID handling (frontend + backend sync)
- Optimized state management using Zustand
- WebSocket-based event-driven architecture

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Canvas API
- Zustand

### Backend
- Node.js
- Express.js
- WebSockets (ws / socket.io)
- Prisma ORM

### Database
- PostgreSQL

---

## 🏗️ Architecture

Client (React + Canvas)
    ↓
WebSocket Layer
    ↓
Backend (Node + Express)
    ↓
Prisma ORM
    ↓
PostgreSQL

---

## ⚙️ Core Features

### Authentication System

- User signup and login
- JWT-based authentication
- Guest users with temporary tokens

---

### Board Management

- Create boards
- View existing boards
- Join boards

---

### Whiteboard Engine

- Draw shapes (rectangle, circle, etc.)
- Drag and reposition elements
- Canvas-based rendering

---

### Real-Time Collaboration

- WebSocket communication
- Broadcast updates to all users
- Live synchronization

---

## 🔄 Data Flow

User Action → WebSocket Event → Backend → Broadcast → UI Update



## 📂 Project Structure

whiteboard-app/

├── frontend/
│   ├── components/
│   ├── pages/
│   ├── store/
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

---

## ⚡ Getting Started

### 1. Clone Repository

git clone https://github.com/your-username/whiteboard-app.git  
cd whiteboard-app  

---

### 2. Backend Setup

cd backend  
npm install  
npx prisma migrate dev  
npm run dev  

---

### 3. Frontend Setup

cd frontend  
npm install  
npm run dev  

---

## 🔐 Environment Variables

Backend (.env)

DATABASE_URL=your_database_url  
JWT_SECRET=your_secret_key  
PORT=5000  

---

## 🚀 Performance Considerations

- Reduced unnecessary re-renders using Zustand
- Efficient WebSocket handling
- Optimized drag updates
- Scalable backend structure

---

## 🧪 Future Enhancements

- Undo / Redo functionality
- Export board as image or PDF
- Role-based permissions
- Multi-board support
- Mobile responsiveness
- Advanced conflict handling (CRDT / OT)

---

## 🤝 Contributing

- Fork the repository
- Create a new branch
- Make your changes
- Submit a pull request

---

## 🧑‍💻 Author

Nishant




