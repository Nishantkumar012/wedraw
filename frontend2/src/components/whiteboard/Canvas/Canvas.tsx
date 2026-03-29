import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoardStore } from '../../../store/useBoardStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../services/api';
import type { ShapeData } from '../../../types';

export const Canvas = () => {
    const { boardId } = useParams();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<ShapeData | null>(null);

    // Selection and moving state
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);

    // Store variables
    const activeTool = useBoardStore(state => state.activeTool);
    const activeColor = useBoardStore(state => state.activeColor);
    const elements = useBoardStore(state => state.elements);
    const setElements = useBoardStore(state => state.setElements);
    const addElement = useBoardStore(state => state.addElement);

    const { userToken, guestToken } = useAuthStore();

    // Resize canvas
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
                drawElements();
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [elements, currentShape, selectedElementId]);

    // Initial Fetch & WebSocket Setup
    useEffect(() => {
        const token = userToken || guestToken;
        if (!token || !boardId) return;

        api.get(`/boards/${boardId}/elements`)
            .then(res => {
                const loadedElements = res.data.map((el: any) => ({
                    id: el.id,
                    type: el.type.toLowerCase(),
                    boardId: el.boardId,
                    color: el.data.color || '#000',
                    data: el.data
                }));
                setElements(loadedElements);
            })
            .catch(err => console.error('Failed to fetch elements', err));

        const ws = new WebSocket(`ws://localhost:3000?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ action: "join_board", boardId }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.action === "element_added") {
                const el = msg.element;
                const newShape = {
                    id: el.id,
                    type: el.type.toLowerCase(),
                    boardId: el.boardId,
                    color: el.data.color || '#000',
                    data: el.data
                };

                const currentElements = useBoardStore.getState().elements;
                const tempIndex = currentElements.findIndex(s => s.isTemp);

                if (tempIndex !== -1) {
                    const nextElements = [...currentElements];
                    nextElements[tempIndex] = newShape;
                    useBoardStore.getState().setElements(nextElements);
                } else {
                    addElement(newShape);
                }
            } else if (msg.action === "element_updated" || msg.action === "element_dragging") {
                useBoardStore.getState().updateElement(msg.elementId, { data: msg.data });
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [boardId, userToken, guestToken, setElements, addElement]);

    // Hit Testing logic for selection
    const hitTest = (x: number, y: number, element: ShapeData) => {
        const { type, data } = element;

        if (type === 'rectangle' && data.x !== undefined) {
            const minX = Math.min(data.x, data.x + data.width!);
            const maxX = Math.max(data.x, data.x + data.width!);
            const minY = Math.min(data.y!, data.y! + data.height!);
            const maxY = Math.max(data.y!, data.y! + data.height!);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }

        if (type === 'circle' && data.x !== undefined) {
            const cx = data.x + data.width! / 2;
            const cy = data.y! + data.height! / 2;
            const r = Math.abs(data.width!) / 2; // radius
            return Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2)) <= r;
        }

        if ((type === 'pencil' || type === 'line') && data.points && data.points.length > 0) {
            const xs = data.points.map(p => p.x);
            const ys = data.points.map(p => p.y);
            const pad = 10; // 10px grab padding
            const minX = Math.min(...xs) - pad; const maxX = Math.max(...xs) + pad;
            const minY = Math.min(...ys) - pad; const maxY = Math.max(...ys) + pad;
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }
        return false;
    }

    // Redraw loop
    const drawElements = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const allShapes = currentShape ? [...elements, currentShape] : elements;

        allShapes.forEach(shape => {
            ctx.strokeStyle = shape.color || shape.data.color || '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (shape.type === 'pencil' && shape.data.points) {
                const pts = shape.data.points;
                if (pts.length > 0) {
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) {
                        ctx.lineTo(pts[i].x, pts[i].y);
                    }
                }
            } else if (shape.type === 'rectangle' && shape.data.x !== undefined) {
                ctx.rect(shape.data.x, shape.data.y!, shape.data.width!, shape.data.height!);
            } else if (shape.type === 'circle' && shape.data.x !== undefined) {
                const radius = Math.abs(shape.data.width!) / 2;
                ctx.arc(shape.data.x + shape.data.width! / 2, shape.data.y! + shape.data.height! / 2, radius, 0, 2 * Math.PI);
            } else if (shape.type === 'line' && shape.data.points?.length === 2) {
                ctx.moveTo(shape.data.points[0].x, shape.data.points[0].y);
                ctx.lineTo(shape.data.points[1].x, shape.data.points[1].y);
            }

            ctx.stroke();

            // Highlight selected element
            if (activeTool === 'select' && shape.id === selectedElementId) {
                ctx.strokeStyle = '#3b82f6'; // Tailwind blue-500
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);

                if (shape.type === 'rectangle' || shape.type === 'circle') {
                    const minX = Math.min(shape.data.x!, shape.data.x! + shape.data.width!);
                    const minY = Math.min(shape.data.y!, shape.data.y! + shape.data.height!);
                    const w = Math.abs(shape.data.width!);
                    const h = Math.abs(shape.data.height!);
                    ctx.strokeRect(minX - 4, minY - 4, w + 8, h + 8);
                } else if (shape.type === 'pencil' || shape.type === 'line') {
                    if (shape.data.points && shape.data.points.length > 0) {
                        const xs = shape.data.points.map(p => p.x);
                        const ys = shape.data.points.map(p => p.y);
                        const minX = Math.min(...xs); const maxX = Math.max(...xs);
                        const minY = Math.min(...ys); const maxY = Math.max(...ys);
                        ctx.strokeRect(minX - 4, minY - 4, (maxX - minX) + 8, (maxY - minY) + 8);
                    }
                }
                ctx.setLineDash([]); // Reset
            }
        });
    };

    useEffect(() => {
        drawElements();
    }, [elements, currentShape, selectedElementId, activeTool]);

    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || !boardId) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'select') {
            // Find selecting from top to bottom
            for (let i = elements.length - 1; i >= 0; i--) {
                if (hitTest(x, y, elements[i])) {
                    setSelectedElementId(elements[i].id);
                    setDragOffset({ x, y });
                    setIsDrawing(true); // Hijack for 'isDragging'
                    return;
                }
            }
            setSelectedElementId(null);
            return;
        }

        setSelectedElementId(null);
        setIsDrawing(true);

        const newShape: ShapeData = {
            id: Math.random().toString(36).substr(2, 9),
            boardId,
            type: activeTool as any,
            color: activeColor,
            data: {
                x, y, width: 0, height: 0, points: [{ x, y }]
            }
        };
        setCurrentShape(newShape);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // DRAG LOGIC
        if (activeTool === 'select' && selectedElementId && dragOffset) {
            const dx = x - dragOffset.x;
            const dy = y - dragOffset.y;

            const el = elements.find(el => el.id === selectedElementId);
            if (!el) return;

            const newData = structuredClone(el.data);

            if ((el.type === 'rectangle' || el.type === 'circle') && newData.x !== undefined) {
                newData.x += dx;
                newData.y! += dy;
            } else if ((el.type === 'pencil' || el.type === 'line') && newData.points) {
                newData.points = newData.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
            }

            useBoardStore.getState().updateElement(selectedElementId, { data: newData });
            setDragOffset({ x, y });

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: "element_dragging",
                    boardId: el.boardId,
                    elementId: el.id,
                    data: newData
                }));
            }
            return;
        }

        // DRAW LOGIC
        if (!currentShape) return;
        const updatedShape = { ...currentShape };

        if (activeTool === 'pencil') {
            updatedShape.data.points!.push({ x, y });
        } else if (activeTool === 'rectangle' || activeTool === 'circle') {
            updatedShape.data.width = x - updatedShape.data.x!;
            updatedShape.data.height = y - updatedShape.data.y!;
        } else if (activeTool === 'line') {
            updatedShape.data.points![1] = { x, y };
        }

        setCurrentShape(updatedShape);
    };

    const handlePointerUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        // END DRAG LOGIC
        if (activeTool === 'select' && selectedElementId) {
            const el = elements.find(el => el.id === selectedElementId);
            if (el && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: "element_updated",
                    boardId: el.boardId,
                    elementId: el.id,
                    data: el.data
                }));
            }
            setDragOffset(null);
            return;
        }

        // END DRAW LOGIC
        if (!currentShape) return;

        // Save locally optimistically
        const finalShape = { ...currentShape, isTemp: true };
        addElement(finalShape);

        // Dispatch to backend
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: "element_add",
                boardId: currentShape.boardId,
                element: {
                    type: currentShape.type,
                    data: { ...currentShape.data, color: currentShape.color }
                }
            }));
        }

        setCurrentShape(null);
    };

    return (
        <div ref={containerRef} className="flex-1 h-full bg-slate-50 relative overflow-hidden">
            <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 touch-none ${activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />

            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                Tool: <span className="capitalize">{activeTool}</span>
            </div>

            {activeTool === 'select' && selectedElementId && (
                <div className="absolute bottom-4 right-4 bg-blue-100 px-3 py-1 text-blue-700 text-sm font-medium rounded shadow-sm border border-blue-200">
                    Shape selected (Drag to move)
                </div>
            )}
        </div>
    );
};
