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

    const renderCreateCard = () => {
        if (isCreating) {
            return (
                <form
                    onSubmit={handleCreateBoard}
                    className="p-6 border-2 border-solid border-blue-400 rounded-xl bg-blue-50 flex flex-col justify-center min-h-[120px]"
                >
                    <input
                        autoFocus
                        type="text"
                        placeholder="Enter board name..."
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500 mb-3 bg-white"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setNewBoardTitle('');
                            }}
                            className="flex-[0.5] py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-sm font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition shadow-sm"
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
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-center min-h-[120px] transition"
            >
                <span className="text-blue-600 font-medium text-lg">+ Create New</span>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800">Your Boards</h1>
                <button
                    onClick={logout}
                    className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
                >
                    Logout
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-16 text-gray-500">Loading boards...</div>
            ) : boards.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <p className="text-gray-500 mb-6 text-lg">You don't have any boards yet.</p>

                    {isCreating ? (
                        <form onSubmit={handleCreateBoard} className="flex gap-2 w-full max-w-md bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter board name..."
                                value={newBoardTitle}
                                onChange={(e) => setNewBoardTitle(e.target.value)}
                                className="flex-1 px-4 py-2 rounded outline-none"
                            />
                            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition shadow-sm">Create</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-100 text-gray-600 hover:text-gray-900 rounded font-medium hover:bg-gray-200 transition">Cancel</button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
                        >
                            Create New Board
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {renderCreateCard()}

                    {boards.map((board) => (
                        <div
                            key={board.boardId}
                            
                            className="flex flex-col p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg cursor-pointer bg-white transition duration-200"
                            onClick={() => navigate(`/board/${board.boardId}`,{
                                state: { role: board.role}
                            })}
                        >
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={board.title}>{board.title}</h3>
                            <p className="text-xs font-mono text-gray-400 mt-auto pt-4 border-t border-gray-100">ID: {board.boardId}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
