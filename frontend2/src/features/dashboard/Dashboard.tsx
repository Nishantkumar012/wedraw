import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [boards, setBoards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');


    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const res = await api.get('/boards/me');
            console.log(res)
            setBoards(res.data);
        } catch (error) {
            console.error('Failed to fetch boards', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const finalTitle = newBoardTitle.trim() || 'Untitled Board';

        try {
            const res = await api.post('/boards', { title: finalTitle });
            navigate(`/board/${res.data.id}`);
        } catch (error) {
            console.error('Failed to create board', error);
        }
    };

    const formatRelativeTime = (dateString?: string) => {
        if (!dateString) return 'Edited recently';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 1) return 'Edited just now';
        if (diffInHours < 24) return `Edited ${diffInHours} hours ago`;
        if (diffInDays === 1) return 'Edited yesterday';
        if (diffInDays < 7) return `Edited ${diffInDays} days ago`;

        return `Edited ${date.toLocaleDateString()}`;
    };

    const renderCreateCard = () => {
        if (isCreating) {
            return (
                <form
                    onSubmit={handleCreateBoard}
                    className="bg-[#F4FAFD] rounded-2xl p-6 pressed-neumorphic transition-all duration-300"
                >
                    <input
                        autoFocus
                        type="text"
                        placeholder="Enter board name..."
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#EEF5F7] rounded-lg pressed-neumorphic outline-none text-[#161D1F] placeholder-[#5B5F62] mb-4"
                    />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setNewBoardTitle('');
                            }}
                            className="flex-1 py-2 px-4 bg-[#F4FAFD] raised-neumorphic rounded-lg text-[#5B5F62] font-medium hover:shadow-sm active:shadow-none transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 px-4 bg-[#4352A5] text-white rounded-lg shadow-lg hover:shadow-xl active:shadow-md transition-all text-sm font-medium"
                        >
                            Create
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <div
                onClick={() => setIsCreating(true)}
                className="bg-[#F4FAFD] rounded-2xl p-6 raised-neumorphic cursor-pointer hover:shadow-xl active:pressed-neumorphic transition-all duration-300 flex items-center justify-center min-h-[180px]"
            >
                <span className="text-[#4352A5] font-semibold text-base">+ New board</span>
            </div>
        );
    };

    const BoardThumbnail = ({ title }: { title: string }) => {
        const colors = [
            { bg: '#FFF9C4', accent: '#FBC02D' },
            { bg: '#B3E5FC', accent: '#0288D1' },
            { bg: '#F8BBD0', accent: '#C2185B' },
            { bg: '#C5E1A5', accent: '#558B2F' },
        ];

        const colorIndex = title.length % colors.length;
        const color = colors[colorIndex];

        return (
            <div className="w-full h-28 bg-[#EEF5F7] rounded-lg p-3 relative overflow-hidden mb-4 pressed-neumorphic">
                <div
                    className="absolute top-2 left-2 w-16 h-12 rounded opacity-70"
                    style={{ backgroundColor: color.bg }}
                />
                <div
                    className="absolute top-4 right-3 w-12 h-12 rounded-full opacity-50"
                    style={{ backgroundColor: color.accent }}
                />
                <div
                    className="absolute bottom-2 left-4 w-20 h-2 rounded-full opacity-60"
                    style={{ backgroundColor: color.bg }}
                />
                <svg className="absolute bottom-3 right-4 w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="2">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F4FAFD] p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 md:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#161D1F] mb-2">Your workspace</h1>
                        <p className="text-[#5B5F62] text-sm md:text-base">Manage and organize your collaborative boards.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={logout}
                            className="p-2.5 md:p-3 bg-[#F4FAFD] raised-neumorphic rounded-xl hover:shadow-xl active:pressed-neumorphic transition-all"
                            title="Logout"
                        >
                            <svg className="w-5 h-5 text-[#5B5F62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                        <button
                            className="p-2.5 md:p-3 bg-[#F4FAFD] raised-neumorphic rounded-xl hover:shadow-xl active:pressed-neumorphic transition-all"
                            title="Settings"
                        >
                            <svg className="w-5 h-5 text-[#5B5F62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button
                            className="p-2.5 md:p-3 bg-[#F4FAFD] raised-neumorphic rounded-xl hover:shadow-xl active:pressed-neumorphic transition-all"
                            title="User Menu"
                        >
                            <svg className="w-5 h-5 text-[#5B5F62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20">
                        <div className="w-16 h-16 border-4 border-[#E2E9EC] border-t-[#4352A5] rounded-full animate-spin mb-4"></div>
                        <p className="text-[#5B5F62]">Loading boards...</p>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 bg-[#F4FAFD] rounded-3xl pressed-neumorphic">
                        <svg className="w-24 h-24 text-[#E2E9EC] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[#5B5F62] mb-8 text-lg">You don't have any boards yet.</p>

                        {isCreating ? (
                            <form onSubmit={handleCreateBoard} className="w-full max-w-md bg-[#F4FAFD] p-6 rounded-2xl pressed-neumorphic">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Enter board name..."
                                    value={newBoardTitle}
                                    onChange={(e) => setNewBoardTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF5F7] rounded-lg pressed-neumorphic outline-none text-[#161D1F] placeholder-[#5B5F62] mb-4"
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-5 py-2.5 bg-[#F4FAFD] raised-neumorphic rounded-lg text-[#5B5F62] font-medium hover:shadow-xl active:shadow-none transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-5 py-2.5 bg-[#4352A5] text-white rounded-lg shadow-lg hover:shadow-xl active:shadow-md transition-all font-medium"
                                    >
                                        Create Board
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="px-8 py-3.5 bg-[#F4FAFD] raised-neumorphic rounded-xl text-[#4352A5] font-semibold hover:shadow-xl active:pressed-neumorphic transition-all"
                            >
                                + Create New Board
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* New Board Card */}
                        {renderCreateCard()}

                        {/* Board Cards */}
                        {boards.map((permission) => (
                            <div
                                key={permission.boardId}
                                onClick={() => navigate(`/board/${permission.boardId}`, {
                                    state: { role: permission.role }
                                })}
                                className="bg-[#F4FAFD] rounded-2xl p-6 raised-neumorphic cursor-pointer hover:shadow-xl active:pressed-neumorphic transition-all duration-300 group"
                            >
                                {/* Thumbnail */}
                                <BoardThumbnail title={permission.board?.title || 'Untitled'} />

                                {/* Board Info */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-[#161D1F] truncate group-hover:text-[#4352A5] transition-colors" title={permission.board?.title || 'Untitled'}>
                                        {permission.board?.title || 'Untitled'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-[#5B5F62]">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{formatRelativeTime(permission.board?.updatedAt)}</span>
                                    </div>
                                    {permission.role && (
                                        <span className="inline-block px-2.5 py-1 bg-[#EEF5F7] pressed-neumorphic rounded-lg text-xs font-medium text-[#5B5F62] capitalize">
                                            {permission.role.toLowerCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
