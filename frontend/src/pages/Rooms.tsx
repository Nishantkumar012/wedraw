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
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

   
  const createBoard = async () => {
  if (!newTitle.trim()) {
    alert("Title is required");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }

  try {
    setCreating(true);

    const res = await fetch("http://localhost:3000/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle }),
    });

    if (!res.ok) {
      throw new Error("Failed to create board");
    }

    const board = await res.json();

    // Add new board to UI list
    setRooms((prev) => [board, ...prev]);

    // Reset + close modal
    setNewTitle("");
    setShowModal(false);
  } catch (err: any) {
    alert(err.message || "Error creating board");
  } finally {
    setCreating(false);
  }
};




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
  <div className="flex justify-between">
  <h1 className="text-2xl font-bold text-slate-900 mb-4">
    📋 Your Boards
  </h1>
  <button
  onClick={() => setShowModal(true)}
  className="bg-white/20 
    backdrop-blur-lg 
    border border-white/30 
    shadow-xl 
    p-2 
    rounded-2xl text-l font-bold text-slate-900 mb-2"
>
  ➕ Create board
</button>

    </div>  

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


     {showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
      <h2 className="text-xl font-bold mb-4 text-slate-900">
        🧩 Create a new board
      </h2>

      <input
        type="text"
        placeholder="Enter board title"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        className="w-full p-2 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setShowModal(false);
            setNewTitle("");
          }}
          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
        >
          Cancel
        </button>

        <button
          onClick={createBoard}
          disabled={creating}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  </div>
)}


</div>


);
};

export default Rooms;
