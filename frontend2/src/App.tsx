import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import { Dashboard } from './features/dashboard/Dashboard';
import { BoardView } from './features/board/BoardView';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import './App.css'
// import './index.css'



function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Mixed Route: User OR Guest Token */}
      <Route path="/board/:boardId" element={<BoardView />} />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
