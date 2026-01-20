import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

type Room = {
  id: string;
  title: string;
};

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

useEffect(() => {
    const token = localStorage.getItem('token');
//   const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Njk2YjdjYi1lNGVjLTRkZGEtYTc4Zi1hMGZjOGRhY2NhMDIiLCJpYXQiOjE3Njg5MTA1MTJ9.8tqhdajgxNEB0VZmdG6N_3ILHqM922YfD_Ugnzlfcts"         //localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }

  const fetchBoards = async () => {
    try {
      const res = await fetch("http://localhost:3000/boards/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await res.json();
      console.log(data);
      setRooms(data); // rooms = boards from backend
    } catch (err: any) {
      setError(err.message || "Failed to fetch boards");
    } finally {
      setLoading(false);
    }
  };

  fetchBoards();
}, [navigate]);


  if (loading) return <p className="
  h-screen p-6 
  bg-gradient-to-br 
  from-indigo-300 via-purple-300 to-pink-300
">⏳ Loading boards...</p>;
  if (error) return <p className="
  h-screen p-6 
  bg-gradient-to-br 
  from-indigo-300 via-purple-300 to-pink-300
">❌ {error}</p>;

  return (
  
      <div className="
  h-screen p-6 
  bg-gradient-to-br 
  from-indigo-300 via-purple-300 to-pink-300
">
  <h1 className="text-2xl font-bold text-slate-900 mb-4">
    📋 Your Boards
  </h1>

  <ul className="
    bg-white/20 
    backdrop-blur-lg 
    border border-white/30 
    shadow-xl 
    m-2 p-4 
    rounded-3xl
  ">
    {rooms.map((room) => (
      <li 
        key={room.id} 
        className="
          p-3 rounded-2xl 
          hover:bg-white/25 
          transition-all duration-200
        "
      >
        <Link 
          to={`/room/${room.id}`} 
          className="
            text-slate-900 font-semibold 
            tracking-wide
          "
        >
          {room.title}
        </Link>
      </li>
    ))}
  </ul>
</div>


);
};

export default Rooms;
