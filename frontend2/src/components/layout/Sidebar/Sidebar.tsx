import { useBoardStore } from '../../../store/useBoardStore';
import { Button } from '../../common/Button';
import { useState } from 'react';
import {
  Pencil,
  Square,
  Circle,
  Minus,
  Trash2,
  MousePointer2,
  UserPlus
} from 'lucide-react';
import type { ShapeType } from '../../../types';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import type { AxiosError } from 'axios';

export const Sidebar = () => {
  const { activeTool, setTool, clearBoard } = useBoardStore();

  const { state } = useLocation();
  // console.log("m hu side bar m", useLocation());
  const role = state?.role || "VIEWER";

  const { boardId } = useParams();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const tools: { id: ShapeType | 'select'; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line' },
  ];

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sendInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      showToast("Email is required ❗", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(`/boards/${boardId}/invite`, {
        email,
        role: inviteRole,
      });

      console.log(res);

      // showToast("Invite sent ✅", "success");
      showToast(res.data.message,"success")

      setIsInviteOpen(false);
      setEmail("");
      setInviteRole("VIEWER");

    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;

      showToast(
        axiosError?.response?.data?.message || "Something went wrong ❌",
        "error"
      );

      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔥 Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[300px]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium relative overflow-hidden
            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {toast.message}
            <div className="absolute bottom-0 left-0 h-1 bg-white/70 animate-progress"></div>
          </div>
        </div>
      )}

      <aside className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 shadow-sm z-10">
        
        {/* Tools */}
        <div className="flex flex-col gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? 'primary' : 'ghost'}
              size="icon"
              onClick={() => setTool(tool.id)}
              title={tool.label}
            >
              {tool.icon}
            </Button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="mt-auto">
          {role === "OWNER" && (
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setIsInviteOpen(true)}
            >
              <UserPlus size={20} />
            </Button>
          )}

          {role !== "VIEWER" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearBoard}
              title="Clear Board"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={20} />
            </Button>
          )}
        </div>

        {/* 🔥 Modal */}
        {isInviteOpen && role === "OWNER" && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
            onClick={() => setIsInviteOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-lg p-6 w-96 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsInviteOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              <h2 className="text-lg font-semibold mb-4">Invite User</h2>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>

              <button
                disabled={loading}
                onClick={sendInvite}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};