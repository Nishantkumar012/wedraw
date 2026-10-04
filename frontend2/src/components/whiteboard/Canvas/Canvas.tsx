import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBoardStore } from '../../../store/useBoardStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../services/api';
import type { ShapeData } from '../../../types';
import { throttle} from "lodash"

export interface CanvasRef {
    handleDelete: () => void;
    handleClearBoard: () => void;
    handleUndo: () => void;
    handleRedo: () => void;
    handleColourChange: (color:string) => void;
}

export const Canvas = forwardRef<CanvasRef>((_props, ref) => {
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
    const deleteElement = useBoardStore(state => state.deleteElement);
    const setSelectedElement = useBoardStore(state => state.setSelectedElement);
    const pushHistory = useBoardStore(state => state.pushHistory);
    const undo = useBoardStore(state => state.undo);
    const redo = useBoardStore(state => state.redo);
    const canUndo = useBoardStore(state => state.canUndo);
    const canRedo = useBoardStore(state => state.canRedo);

    const { userToken, guestToken } = useAuthStore();

    const colorUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Delete handler
    const handleDelete = () => {
        if (activeTool === 'select' && selectedElementId) {
            const element = elements.find(el => el.id === selectedElementId);
            if (element) {
                // Create history entry BEFORE deleting
                pushHistory('element_deleted');

                // Send to backend API
                api.delete(`/boards/${element.boardId}/elements/${element.id}`)
                    .catch(err => console.error('Failed to delete element', err));

                // Send WebSocket message
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        action: "element_deleted",
                        boardId: element.boardId,
                        elementId: element.id,
                    }));
                }
            }
            deleteElement(selectedElementId);
            setSelectedElementId(null);
            setSelectedElement(null);
        }
    };

    // Clear board handler
    const handleClearBoard = () => {
        if (!boardId) return;

        const currentElements = [...elements];

        // Create history entry BEFORE clearing
        pushHistory('clear_board');

        // Clear local state immediately (optimistic update)
        useBoardStore.getState().clearBoard();

        // Delete all elements from backend
        Promise.all(
            currentElements.map(element =>
                api.delete(`/boards/${boardId}/elements/${element.id}`)
                    .catch(err => console.error('Failed to delete element', err))
            )
        ).catch(err => console.error('Failed to clear board', err));

        // Send WebSocket message for each element
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            currentElements.forEach(element => {
                wsRef.current!.send(JSON.stringify({
                    action: "element_deleted",
                    boardId: element.boardId,
                    elementId: element.id,
                }));
            });
        }
    };

    // Undo handler
    const handleUndo = () => {
        if (canUndo()) {
            const prevState = useBoardStore.getState().history[useBoardStore.getState().historyIndex - 1];
            undo();
            // Persist undo to backend
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: "board_state_updated",
                    boardId,
                    elements: prevState.elements
                }));
            }
        }
    };

    // Redo handler
    const handleRedo = () => {
        if (canRedo()) {
            const nextState = useBoardStore.getState().history[useBoardStore.getState().historyIndex + 1];
            redo();
            // Persist redo to backend
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: "board_state_updated",
                    boardId,
                    elements: nextState.elements
                }));
            }
        }
    };

    const handleColourChange = (color: string) => {
        if (!selectedElementId) return;

        const element = elements.find(el => el.id === selectedElementId);
        if (!element) return;

        // 1. Local update: immediate
        useBoardStore.getState().updateElement(selectedElementId, {
            data: { ...element.data, color }
        });
        pushHistory('element_updated');

        // 2. WebSocket broadcast: immediate (dusre users ko real-time)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: "element_color_changed",
                boardId: element.boardId,
                elementId: element.id,
                color
            }));
        }

        // 3. Debounced API call: 300ms (DB save)
        if (colorUpdateTimerRef.current) {
            clearTimeout(colorUpdateTimerRef.current);
        }

        colorUpdateTimerRef.current = setTimeout(() => {
            api.patch(`/boards/${element.boardId}/elements/${element.id}`, {
                color
            }).catch(err => console.error('Failed to update color', err));
        }, 300);
    };

    // Expose handlers to parent via ref
    useImperativeHandle(ref, () => ({
        handleDelete,
        handleClearBoard,
        handleUndo,
        handleRedo,
        handleColourChange
    }));

    // Keyboard listener for Delete/Backspace and Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
                return;
            }
            // Redo: Ctrl+Y or Ctrl+Shift+Z
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
                return;
            }
            // Delete/Backspace
            if ((e.key === 'Delete' || e.key === 'Backspace') && activeTool === 'select' && selectedElementId) {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTool, selectedElementId, elements, deleteElement, handleDelete, handleUndo, handleRedo]);

    // Cleanup effect for color update timer
    useEffect(() => {
        return () => {
            if (colorUpdateTimerRef.current) {
                clearTimeout(colorUpdateTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const token = userToken || guestToken;
        if (!token || !boardId) return;

        api.get(`/boards/${boardId}/elements`)
            .then(res => {
                const loadedElements = res.data.map((el: any) => ({
                    id: el.id,
                    type: el.type.toLowerCase(),
                    boardId: el.boardId,
                    color: el.data.color || '#000000',
                    data: {
                        ...el.data,
                        color: el.data.color || '#000000'
                    }
                }));
                setElements(loadedElements);
            })
            .catch(err => console.error('Failed to fetch elements', err));

            // http/ change to ws to connect websocket
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsUrl}?token=${token}`);
        wsRef.current = ws;
        console.log("ws is", ws)

        ws.onopen = () => {
            ws.send(JSON.stringify({ action: "join_board", boardId }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.action === "element_added") {
                const el = msg.element;
                const newShape: ShapeData = {
                    id: el.id,
                    type: el.type.toLowerCase(),
                    boardId: el.boardId,
                    color: el.data.color || '#000000',
                    data: {
                        ...el.data,
                        color: el.data.color || '#000000'
                    }
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
            } else if (msg.action === "element_deleted") {
                useBoardStore.getState().deleteElement(msg.elementId);
            } else if (msg.action === "element_color_changed") {
                const element = useBoardStore.getState().elements.find(el => el.id === msg.elementId);
                if (element) {
                    useBoardStore.getState().updateElement(msg.elementId, {
                        data: { ...element.data, color: msg.color },
                        color: msg.color
                    });
                }
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [boardId, userToken, guestToken, setElements, addElement]);

    // Hit Testing logic for selection deciding if inside or outside shape
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


     // throttling the dragging ,stream line it
    const throttledSend = useRef(
  throttle((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, 50) // 🔥 50ms best
).current;

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
                    setSelectedElement(elements[i].id);
                    setDragOffset({ x, y });
                    setIsDrawing(true); // Hijack for 'isDragging'
                    return;
                }
            }
            setSelectedElementId(null);
            setSelectedElement(null);
            return;
        }

        setSelectedElementId(null);
        setSelectedElement(null);
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

         // cpu heavy task   
            // const newData = structuredClone(el.data);
             
            const newData = {...el.data};

            //  console.log("el ka----> ", el , "el ka data --------->", el.data);
            //  console.log(newData);

            if ((el.type === 'rectangle' || el.type === 'circle') && newData.x !== undefined) {
                newData.x += dx;
                newData.y! += dy;
            } else if ((el.type === 'pencil' || el.type === 'line') && el.data.points) {
                //  newData.points = newData.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                 newData.points = el.data.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                
            }

            useBoardStore.getState().updateElement(selectedElementId, { data: newData });
            setDragOffset({ x, y });

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                // wsRef.current.send(JSON.stringify({
                //     action: "element_dragging",
                //     boardId: el.boardId,
                //     elementId: el.id,
                //     data: newData
                // }));

                
                                throttledSend({
                    action: "element_dragging",
                    boardId: el.boardId,
                    elementId: el.id,
                    data: newData
                });
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
        pushHistory('element_added');

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
        <div ref={containerRef} className="flex-1 h-full bg-[#EEF5F7] relative overflow-hidden">
            {/* Canvas Grid Pattern */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #767683 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            />

            <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 touch-none ${activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />

            {/* Top Right: Active Tool Indicator */}
            <div className="absolute top-4 right-4 bg-[#F4FAFD] px-4 py-2 rounded-full raised-neumorphic text-sm font-medium text-[#5B5F62] flex items-center gap-2">
                <span className="text-[#4352A5] font-semibold">Tool:</span>
                <span className="capitalize text-[#161D1F]">{activeTool}</span>
            </div>

            {/* Selection Indicator */}
            {activeTool === 'select' && selectedElementId && (
                <div className="absolute bottom-20 right-6 bg-[#4352A5] text-white px-4 py-2 text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Shape selected (Drag to move)
                </div>
            )}
        </div>
    );
});

Canvas.displayName = 'Canvas';

// function throttle(arg0: (payload: any) => void, arg1: number): any {
//     throw new Error('Function not implemented.');
// }

