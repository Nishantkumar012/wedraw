import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Canvas } from '../../components/whiteboard/Canvas';
import { useBoardStore } from '../../store/useBoardStore';
import {
    Pencil,
    Square,
    Circle,
    Minus,
    MousePointer2,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Settings,
    Users,
    Share2,
    Download,
    Trash2,
    UserPlus
} from 'lucide-react';
import type { ShapeType } from '../../types';
import { api } from '../../services/api';
import type { AxiosError } from 'axios';

export const BoardView = () => {
    const { boardId } = useParams();
    const [searchParams] = useSearchParams();
    const guestTokenParam = searchParams.get('guestToken');

    const { isAuthenticated, guestToken, setGuestToken } = useAuthStore();
    const { activeTool, setTool, clearBoard } = useBoardStore();

    const { state } = useLocation();
    const role = state?.role || "VIEWER";

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("VIEWER");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (guestTokenParam) {
            setGuestToken(guestTokenParam);
        }
    }, [guestTokenParam, setGuestToken]);

    const hasAccess = isAuthenticated || guestToken || guestTokenParam;

    if (!hasAccess) {
        return <Navigate to={`/login?redirect=/board/${boardId}`} replace />;
    }

    const tools: { id: ShapeType | 'select'; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
        { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
        { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
        { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
        { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    ];

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setIsExiting(false);
        setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setToast(null);
                setIsExiting(false);
            }, 400);
        }, 3000);
    };

    const sendInvite = async (e?: React.SyntheticEvent) => {
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
            showToast(res.data.message, "success");
            setIsInviteOpen(false);
            setEmail("");
            setInviteRole("VIEWER");
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            showToast(
                axiosError?.response?.data?.message || "Something went wrong ❌",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-10 left-0 right-0 flex justify-center z-[999] pointer-events-none">
                    <div
                        className={`
                            w-[320px] px-4 py-3 rounded-xl shadow-2xl text-white font-semibold relative overflow-hidden
                            ${isExiting ? "toast-exit" : "toast-enter"}
                            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === "success" ? "✅" : "❌"}
                            <span>{toast.message}</span>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-white/40 toast-progress" />
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteOpen && role === "OWNER" && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/40 z-[998]"
                    onClick={() => setIsInviteOpen(false)}
                >
                    <div
                        className="bg-[#F4FAFD] rounded-2xl raised-neumorphic p-6 w-96 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsInviteOpen(false)}
                            className="absolute top-2 right-2 text-[#5B5F62] hover:text-[#161D1F]"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg font-semibold mb-4 text-[#161D1F]">Invite User</h2>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            className="w-full border-none pressed-neumorphic bg-[#F4FAFD] rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#4352A5] text-[#161D1F]"
                        />
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full border-none pressed-neumorphic bg-[#F4FAFD] rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#4352A5] text-[#161D1F]"
                        >
                            <option value="">Select Role</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                        </select>
                        <button
                            disabled={loading}
                            onClick={sendInvite}
                            className="w-full bg-[#4352A5] text-white py-2 rounded-full raised-neumorphic-pill hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Invite"}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4FAFD]">
                {/* Top Navigation Bar */}
                <nav className="flex items-center justify-between px-6 bg-[#F4FAFD] h-16 raised-neumorphic z-50">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E2E9EC] flex items-center justify-center pressed-neumorphic">
                            <svg className="w-5 h-5 text-[#4352A5] fill-current" viewBox="0 0 24 24">
                                <path d="M5 12a7 7 0 1 1 14 0 7 7 0 0 1-14 0z" fillOpacity="0.3" />
                                <path d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-[#4352A5]">WeDraw</span>
                    </div>

                    {/* Center Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <button className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg">
                            File
                        </button>
                        <button className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg">
                            Edit
                        </button>
                        <button className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg">
                            View
                        </button>
                        <button className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg flex items-center gap-2">
                            <Share2 size={16} />
                            Share
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {role === "OWNER" && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                className="text-[#4352A5] hover:bg-[#E2E9EC] transition-all p-2 rounded-full"
                                title="Invite users"
                            >
                                <UserPlus size={20} />
                            </button>
                        )}
                        <button className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full">
                            <Download size={20} />
                        </button>
                        <button className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full">
                            <Users size={20} />
                        </button>
                        <button className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full">
                            <Settings size={20} />
                        </button>
                        <button className="bg-[#4352A5] text-white font-semibold text-sm px-5 py-2 rounded-full raised-neumorphic-pill transition-all hover:scale-105">
                            Share
                        </button>
                    </div>
                </nav>

                {/* Main Canvas Area */}
                <main className="flex-1 relative overflow-hidden">
                    <Canvas />

                    {/* Left Floating Toolbar */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 bg-[#F4FAFD] rounded-xl raised-neumorphic flex flex-col items-center gap-3 py-4 z-40">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setTool(tool.id)}
                                title={tool.label}
                                className={`
                                    w-10 h-10 flex items-center justify-center rounded-lg transition-all
                                    ${activeTool === tool.id
                                        ? 'text-[#4352A5] bg-[#DDE4E6] pressed-neumorphic'
                                        : 'text-[#5B5F62] hover:text-[#4352A5] hover:scale-105'
                                    }
                                `}
                            >
                                {tool.icon}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="w-8 h-px bg-[#E2E9EC] my-1" />

                        {/* Clear Board */}
                        {role !== "VIEWER" && (
                            <button
                                onClick={clearBoard}
                                title="Clear Board"
                                className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-600 hover:scale-105 transition-all rounded-lg"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* Bottom Floating Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#F4FAFD] rounded-full px-6 py-3 raised-neumorphic-pill flex items-center gap-8 z-40">
                        <button className="flex flex-col items-center text-[#5B5F62] hover:text-[#4352A5] cursor-pointer hover:scale-110 transition-transform">
                            <Undo2 className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-[1] tracking-[0.05em] font-semibold mt-1">Undo</span>
                        </button>
                        <button className="flex flex-col items-center text-[#5B5F62] hover:text-[#4352A5] cursor-pointer hover:scale-110 transition-transform">
                            <Redo2 className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-[1] tracking-[0.05em] font-semibold mt-1">Redo</span>
                        </button>
                        <div className="w-px h-8 bg-[#E2E9EC]" />
                        <button className="flex flex-col items-center text-[#4352A5] font-bold cursor-pointer hover:scale-110 transition-transform">
                            <ZoomIn className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-[1] tracking-[0.05em] font-semibold mt-1">Zoom</span>
                        </button>
                        <button className="flex flex-col items-center text-[#5B5F62] hover:text-[#4352A5] cursor-pointer hover:scale-110 transition-transform">
                            <ZoomOut className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-[1] tracking-[0.05em] font-semibold mt-1">Reset</span>
                        </button>
                    </div>
                </main>
            </div>
        </>
    );
};
