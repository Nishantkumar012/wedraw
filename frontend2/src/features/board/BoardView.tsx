import { useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Sidebar } from '../../components/layout/Sidebar';
import { Canvas } from '../../components/whiteboard/Canvas';

export const BoardView = () => {
    const { boardId } = useParams();
    const [searchParams] = useSearchParams();
    const guestTokenParam = searchParams.get('guestToken');

    const { isAuthenticated, guestToken, setGuestToken } = useAuthStore();

    useEffect(() => {
        if (guestTokenParam) {
            setGuestToken(guestTokenParam);
        }
    }, [guestTokenParam, setGuestToken]);

    // Allow access if User is logged in, OR has an existing session guest token, OR has a URL guest token
    const hasAccess = isAuthenticated || guestToken || guestTokenParam;

    if (!hasAccess) {
        return <Navigate to={`/login?redirect=/board/${boardId}`} replace />;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white">
            <Sidebar />
            <main className="flex-1 h-full relative">
                <Canvas />
            </main>
        </div>
    );
};
