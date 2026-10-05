import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Canvas, type CanvasRef } from '../../components/whiteboard/Canvas';
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
    UserPlus,
    Palette
} from 'lucide-react';
import type { ShapeType } from '../../types';
import { api } from '../../services/api';
import type { AxiosError } from 'axios';

export const BoardView = () => {
    const { boardId } = useParams();
    const [searchParams] = useSearchParams();
    const guestTokenParam = searchParams.get('guestToken');

    const { isAuthenticated, guestToken, setGuestToken } = useAuthStore();
    const { activeTool, setTool, activeColor, setColor, selectedElementId } = useBoardStore();
    const canUndo = useBoardStore(state => state.canUndo());
    const canRedo = useBoardStore(state => state.canRedo());

    const canvasRef = useRef<CanvasRef>(null);

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
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [customColor, setCustomColor] = useState("#FF0000");
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [brightness, setBrightness] = useState(100);

    // Initialize customColors from localStorage
    const [customColors, setCustomColors] = useState<string[]>(() => {
        if (!boardId) return [];
        const storageKey = `customColors_${boardId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    console.log('Loaded custom colors from localStorage:', parsed);
                    return parsed;
                }
            } catch (err) {
                console.error('Failed to parse saved custom colors:', err);
            }
        }
        return [];
    });

    const [selectedCustomColorIdx, setSelectedCustomColorIdx] = useState<number | null>(null);

    // Save custom colors to localStorage whenever they change
    useEffect(() => {
        if (!boardId) return;
        const storageKey = `customColors_${boardId}`;
        console.log('Saving customColors to localStorage with key:', storageKey, 'Value:', customColors);
        localStorage.setItem(storageKey, JSON.stringify(customColors));
    }, [customColors, boardId]);

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

    const handleColorAreaClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        let x = 0, y = 0;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        const newSat = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newBri = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));

        setSaturation(newSat);
        setBrightness(newBri);

        const rgb = hsvToRgb(hue, newSat, newBri);
        setCustomColor(rgbToHex(rgb[0], rgb[1], rgb[2]));

        if ('touches' in e) {
            const handleMove = (moveE: TouchEvent) => {
                const moveX = moveE.touches[0].clientX - rect.left;
                const moveY = moveE.touches[0].clientY - rect.top;
                const moveSat = Math.max(0, Math.min(100, (moveX / rect.width) * 100));
                const moveBri = Math.max(0, Math.min(100, 100 - (moveY / rect.height) * 100));
                setSaturation(moveSat);
                setBrightness(moveBri);
                const newRgb = hsvToRgb(hue, moveSat, moveBri);
                setCustomColor(rgbToHex(newRgb[0], newRgb[1], newRgb[2]));
            };

            const handleEnd = () => {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            };

            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleEnd);
        }
    };

    const handleHueChange = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        let y = 0;

        if ('touches' in e) {
            y = e.touches[0].clientY - rect.top;
        } else {
            y = e.clientY - rect.top;
        }

        const newHue = Math.max(0, Math.min(360, (y / rect.height) * 360));
        setHue(newHue);

        const rgb = hsvToRgb(newHue, saturation, brightness);
        setCustomColor(rgbToHex(rgb[0], rgb[1], rgb[2]));

        if ('touches' in e) {
            const handleMove = (moveE: TouchEvent) => {
                const moveY = moveE.touches[0].clientY - rect.top;
                const moveHue = Math.max(0, Math.min(360, (moveY / rect.height) * 360));
                setHue(moveHue);
                const newRgb = hsvToRgb(moveHue, saturation, brightness);
                setCustomColor(rgbToHex(newRgb[0], newRgb[1], newRgb[2]));
            };

            const handleEnd = () => {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            };

            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleEnd);
        }
    };

    const handleHexChange = (value: string) => {
        let hex = value;
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }

        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            setCustomColor(hex.toUpperCase());
            const rgb = hexToRgb(hex);
            if (rgb) {
                const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
                setHue(hsv[0]);
                setSaturation(hsv[1]);
                setBrightness(hsv[2]);
            }
        }
    };

    const handleRgbChange = (r: number, g: number, b: number) => {
        const hex = rgbToHex(r, g, b);
        setCustomColor(hex);
        const hsv = rgbToHsv(r, g, b);
        setHue(hsv[0]);
        setSaturation(hsv[1]);
        setBrightness(hsv[2]);
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
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg cursor-not-allowed opacity-60">
                                File
                            </button>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg cursor-not-allowed opacity-60">
                                Edit
                            </button>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg cursor-not-allowed opacity-60">
                                View
                            </button>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg cursor-not-allowed opacity-60 flex items-center gap-2">
                                <Share2 size={16} />
                                Share
                            </button>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
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
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full cursor-not-allowed opacity-60">
                                <Download size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full cursor-not-allowed opacity-60">
                                <Users size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full cursor-not-allowed opacity-60">
                                <Settings size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <button className="bg-[#4352A5] text-white font-semibold text-sm px-5 py-2 rounded-full raised-neumorphic-pill transition-all hover:scale-105">
                            Share
                        </button>
                    </div>
                </nav>

                {/* Main Canvas Area */}
                <main className="flex-1 relative overflow-hidden">
                    <Canvas ref={canvasRef} />

                    {/* Left Floating Toolbar */}
                    <div className="absolute left-6 top-8 bottom-8 w-16 bg-[#F4FAFD] rounded-xl raised-neumorphic flex flex-col items-center gap-3 py-4 z-40 overflow-y-auto scrollbar-hide">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setTool(tool.id)}
                                title={tool.label}
                                className={`
                                    w-10 h-10 flex items-center justify-center rounded-lg transition-all flex-shrink-0
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
                        <div className="w-8 h-px bg-[#E2E9EC] my-1 flex-shrink-0" />

                        {/* Color Palette Section - Independently Scrollable (Hidden Scrollbar) */}
                        <div className="flex flex-col items-center flex-1 overflow-y-auto scrollbar-hide min-h-0">
                            {/* Basic Colors */}
                            <div className="flex flex-col items-center gap-2 w-full px-2 flex-shrink-0">
                                <div className="text-xs font-medium text-[#5B5F62] mb-1">Basic</div>
                                {["#000000", "#FF0000", "#00AA00", "#0000FF", "#FFAA00", "#FF00FF", "#00AAAA"].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setSelectedCustomColorIdx(null);
                                            // If a shape is selected, change its color
                                            if (selectedElementId && activeTool === 'select') {
                                                canvasRef.current?.handleColourChange(color);
                                            } else {
                                                // Otherwise, set the color for the next shape to be created
                                                setColor(color);
                                            }
                                        }}
                                        className={`
                                            w-7 h-7 rounded transition-all flex-shrink-0
                                            ${activeColor === color
                                                ? 'ring-2 ring-offset-2 ring-[#4352A5] scale-110'
                                                : 'hover:scale-105'
                                            }
                                        `}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>

                            {/* Custom Color Picker Button */}
                            <button
                                onClick={() => {
                                    setSelectedCustomColorIdx(null);
                                    setIsColorPickerOpen(true);
                                }}
                                className="w-7 h-7 rounded transition-all hover:scale-105 border-2 border-dashed border-[#4352A5] flex items-center justify-center mt-2 flex-shrink-0"
                                title="Custom color"
                            >
                                <Palette size={14} className="text-[#4352A5]" />
                            </button>

                            {/* Divider */}
                            {customColors.length > 0 && <div className="w-6 h-px bg-[#E2E9EC] my-2 flex-shrink-0" />}

                            {/* Custom Saved Colors */}
                            {customColors.length > 0 && (
                                <div className="flex flex-col items-center gap-2 w-full px-2">
                                    <div className="text-xs font-medium text-[#5B5F62] flex-shrink-0">Custom</div>
                                    {customColors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="relative w-7 h-7 group"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomColorIdx(idx);
                                                    // If a shape is selected, change its color
                                                    if (selectedElementId && activeTool === 'select') {
                                                        canvasRef.current?.handleColourChange(color);
                                                    } else {
                                                        // Otherwise, set the color for the next shape to be created
                                                        setColor(color);
                                                    }
                                                }}
                                                className={`
                                                    w-full h-full rounded transition-all
                                                    ${activeColor === color && selectedCustomColorIdx === idx
                                                        ? 'ring-2 ring-offset-2 ring-[#4352A5] scale-110'
                                                        : 'hover:scale-105 border-2 border-[#E2E9EC]'
                                                    }
                                                `}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                            {/* Delete button on hover - more visible */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const updatedColors = customColors.filter((_, i) => i !== idx);
                                                    setCustomColors(updatedColors);
                                                    if (selectedCustomColorIdx === idx) {
                                                        setSelectedCustomColorIdx(null);
                                                        setColor("#000000");
                                                    }
                                                }}
                                                className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110 leading-none p-0 font-bold shadow-md"
                                                title="Delete custom color"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delete Button - Only show when element is selected in select mode */}
                        {role !== "VIEWER" && activeTool === 'select' && selectedElementId && (
                            <button
                                onClick={() => {
                                    canvasRef.current?.handleDelete();
                                }}
                                title="Delete selected element (Delete/Backspace)"
                                className="w-10 h-10 flex items-center justify-center text-orange-500 hover:text-orange-600 hover:scale-105 transition-all rounded-lg hover:bg-orange-100 shrink-0"
                            >
                                <Minus size={20} />
                            </button>
                        )}

                        {/* Divider */}
                        <div className="w-8 h-px bg-[#E2E9EC] my-1 shrink-0" />

                        {/* Clear Board */}
                        {role !== "VIEWER" && (
                            <button
                                onClick={() => {
                                    canvasRef.current?.handleClearBoard();
                                }}
                                title="Clear entire board"
                                className="w-10 h-10 flex items-center justify-center text-red-600 hover:text-red-700 hover:scale-105 transition-all rounded-lg hover:bg-red-100 shrink-0"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* Bottom Floating Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#F4FAFD] rounded-full px-6 py-3 raised-neumorphic-pill flex items-center gap-8 z-40">
                        <button
                            onClick={() => {
                                console.log('Undo clicked, canUndo:', canUndo);
                                if (canUndo) {
                                    canvasRef.current?.handleUndo();
                                }
                            }}
                            className={`flex flex-col items-center hover:scale-110 transition-transform ${
                                canUndo
                                    ? 'text-[#5B5F62] hover:text-[#4352A5] cursor-pointer'
                                    : 'text-[#D0D5D7] cursor-not-allowed opacity-50'
                            }`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-none tracking-[0.05em] font-semibold mt-1">Undo</span>
                        </button>
                        <button
                            onClick={() => {
                                console.log('Redo clicked, canRedo:', canRedo);
                                if (canRedo) {
                                    canvasRef.current?.handleRedo();
                                }
                            }}
                            className={`flex flex-col items-center hover:scale-110 transition-transform ${
                                canRedo
                                    ? 'text-[#5B5F62] hover:text-[#4352A5] cursor-pointer'
                                    : 'text-[#D0D5D7] cursor-not-allowed opacity-50'
                            }`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="w-5 h-5" strokeWidth={2.5} />
                            <span className="text-[11px] leading-none tracking-[0.05em] font-semibold mt-1">Redo</span>
                        </button>
                        <div className="w-px h-8 bg-[#E2E9EC]" />
                        <div className="relative group">
                            <button disabled className="flex flex-col items-center text-[#4352A5] font-bold cursor-not-allowed opacity-60 hover:scale-110 transition-transform">
                                <ZoomIn className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[11px] leading-none tracking-[0.05em] font-semibold mt-1">Zoom</span>
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                        <div className="relative group">
                            <button disabled className="flex flex-col items-center text-[#5B5F62] hover:text-[#4352A5] cursor-not-allowed opacity-60 hover:scale-110 transition-transform">
                                <ZoomOut className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[11px] leading-none tracking-[0.05em] font-semibold mt-1">Reset</span>
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-[#161D1F] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                Coming soon
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Custom Color Picker Modal */}
            {isColorPickerOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/40 z-[998]"
                    onClick={() => setIsColorPickerOpen(false)}
                >
                    <div
                        className="bg-[#F4FAFD] rounded-2xl raised-neumorphic p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsColorPickerOpen(false)}
                            className="absolute top-3 right-3 text-[#5B5F62] hover:text-[#161D1F] text-xl"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg font-semibold mb-4 text-[#161D1F]">Custom Color</h2>

                        {/* Main Picker Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                            {/* 2D Color Picker */}
                            <div className="lg:col-span-2">
                                <div className="mb-2 text-sm font-medium text-[#5B5F62]">Color Area</div>
                                <div
                                    className="relative w-full h-48 rounded-lg border-2 border-[#E2E9EC] cursor-crosshair overflow-hidden"
                                    style={{
                                        background: `linear-gradient(to right, white, hsl(${hue}, 100%, 50%)), linear-gradient(to top, black, transparent)`
                                    }}
                                    onMouseDown={(e) => handleColorAreaClick(e)}
                                    onTouchStart={(e) => handleColorAreaClick(e)}
                                >
                                    {/* Color selector circle */}
                                    <div
                                        className="absolute w-5 h-5 border-3 border-white rounded-full shadow-lg pointer-events-none"
                                        style={{
                                            left: `${saturation}%`,
                                            top: `${100 - brightness}%`,
                                            transform: 'translate(-50%, -50%)',
                                            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Hue Slider (Vertical) */}
                            <div>
                                <div className="mb-2 text-sm font-medium text-[#5B5F62]">Hue</div>
                                <div
                                    className="relative w-full h-48 rounded-lg border-2 border-[#E2E9EC] cursor-pointer overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(to bottom, red, yellow, lime, cyan, blue, magenta, red)'
                                    }}
                                    onMouseDown={(e) => handleHueChange(e)}
                                    onTouchStart={(e) => handleHueChange(e)}
                                >
                                    {/* Hue selector */}
                                    <div
                                        className="absolute w-full h-1 bg-white border-2 border-gray-800 pointer-events-none"
                                        style={{
                                            top: `${(hue / 360) * 100}%`,
                                            transform: 'translateY(-50%)',
                                            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Color Preview & Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Color Preview */}
                            <div>
                                <div className="text-sm font-medium text-[#5B5F62] mb-2">Preview</div>
                                <div
                                    className="w-full h-20 rounded-lg raised-neumorphic border-2 border-[#E2E9EC]"
                                    style={{ backgroundColor: customColor }}
                                />
                            </div>

                            {/* HEX Input */}
                            <div>
                                <label className="text-sm font-medium text-[#5B5F62] mb-2 block">HEX</label>
                                <input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => handleHexChange(e.target.value)}
                                    placeholder="#FF0000"
                                    className="w-full border-none pressed-neumorphic bg-[#F4FAFD] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4352A5] text-[#161D1F] font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* RGB Sliders */}
                        <div className="mb-4 p-3 bg-[#EEF5F7] rounded-lg">
                            <p className="text-sm font-medium text-[#5B5F62] mb-3">RGB Values</p>
                            <div className="space-y-2">
                                {(() => {
                                    const rgb = hexToRgb(customColor);
                                    return rgb ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <label className="w-12 text-xs font-medium text-[#5B5F62]">R:</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[0]}
                                                    onChange={(e) => handleRgbChange(parseInt(e.target.value), rgb[1], rgb[2])}
                                                    className="flex-1 h-2 bg-gradient-to-r from-black to-red-500 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[0]}
                                                    onChange={(e) => handleRgbChange(Math.min(255, Math.max(0, parseInt(e.target.value) || 0)), rgb[1], rgb[2])}
                                                    className="w-12 border-none pressed-neumorphic bg-[#F4FAFD] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#4352A5] text-[#161D1F] text-xs"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-12 text-xs font-medium text-[#5B5F62]">G:</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[1]}
                                                    onChange={(e) => handleRgbChange(rgb[0], parseInt(e.target.value), rgb[2])}
                                                    className="flex-1 h-2 bg-gradient-to-r from-black to-green-500 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[1]}
                                                    onChange={(e) => handleRgbChange(rgb[0], Math.min(255, Math.max(0, parseInt(e.target.value) || 0)), rgb[2])}
                                                    className="w-12 border-none pressed-neumorphic bg-[#F4FAFD] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#4352A5] text-[#161D1F] text-xs"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="w-12 text-xs font-medium text-[#5B5F62]">B:</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[2]}
                                                    onChange={(e) => handleRgbChange(rgb[0], rgb[1], parseInt(e.target.value))}
                                                    className="flex-1 h-2 bg-gradient-to-r from-black to-blue-500 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="255"
                                                    value={rgb[2]}
                                                    onChange={(e) => handleRgbChange(rgb[0], rgb[1], Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
                                                    className="w-12 border-none pressed-neumorphic bg-[#F4FAFD] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#4352A5] text-[#161D1F] text-xs"
                                                />
                                            </div>
                                        </>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        {/* Basic Colors */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-[#5B5F62] mb-2">Basic Colors</p>
                            <div className="flex flex-wrap gap-2">
                                {["#000000", "#FF0000", "#00AA00", "#0000FF", "#FFAA00", "#FF00FF", "#00AAAA", "#FFFFFF"].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setCustomColor(color);
                                            const rgb = hexToRgb(color);
                                            if (rgb) {
                                                const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
                                                setHue(hsv[0]);
                                                setSaturation(hsv[1]);
                                                setBrightness(hsv[2]);
                                            }
                                        }}
                                        className={`w-8 h-8 rounded border-2 transition-all ${
                                            customColor === color
                                                ? 'border-[#4352A5] scale-110'
                                                : 'border-[#E2E9EC] hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-[#5B5F62]">Custom Colors</p>
                                <button
                                    onClick={() => {
                                        if (!customColors.includes(customColor) && customColors.length < 8) {
                                            setCustomColors([...customColors, customColor]);
                                            showToast('Color saved! ✅', 'success');
                                        }
                                    }}
                                    disabled={customColors.includes(customColor) || customColors.length >= 8}
                                    className="text-xs px-2 py-1 bg-[#4352A5] text-white rounded hover:bg-[#3a4490] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    title={customColors.includes(customColor) ? "Color already saved" : customColors.length >= 8 ? "Maximum 8 colors" : "Save current color"}
                                >
                                    + Save
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {customColors.map((color, idx) => (
                                    <div key={idx} className="relative group">
                                        <button
                                            onClick={() => {
                                                setCustomColor(color);
                                                const rgb = hexToRgb(color);
                                                if (rgb) {
                                                    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
                                                    setHue(hsv[0]);
                                                    setSaturation(hsv[1]);
                                                    setBrightness(hsv[2]);
                                                }
                                            }}
                                            className={`w-8 h-8 rounded border-2 transition-all ${
                                                customColor === color
                                                    ? 'border-[#4352A5] scale-110'
                                                    : 'border-[#E2E9EC] hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCustomColors(customColors.filter((_, i) => i !== idx));
                                            }}
                                            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Delete color"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsColorPickerOpen(false)}
                                className="flex-1 bg-[#E2E9EC] text-[#161D1F] py-2 rounded-full raised-neumorphic hover:scale-105 transition-transform font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedElementId && activeTool === 'select') {
                                        canvasRef.current?.handleColourChange(customColor);
                                    } else {
                                        setColor(customColor);
                                    }
                                    setIsColorPickerOpen(false);
                                }}
                                className="flex-1 bg-[#4352A5] text-white py-2 rounded-full raised-neumorphic-pill hover:scale-105 transition-transform font-medium text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Helper functions for color conversion
function hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h < 1 / 6) {
        r = c; g = x; b = 0;
    } else if (h < 2 / 6) {
        r = x; g = c; b = 0;
    } else if (h < 3 / 6) {
        r = 0; g = c; b = x;
    } else if (h < 4 / 6) {
        r = 0; g = x; b = c;
    } else if (h < 5 / 6) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
