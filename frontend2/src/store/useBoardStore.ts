import { create } from 'zustand';
import type { ShapeData, ShapeType } from '../types';

export type HistoryAction = 'element_added' | 'element_updated' | 'element_deleted' | 'clear_board' | 'undo' | 'redo';

export interface HistoryEntry {
    timestamp: number;
    action: HistoryAction;
    elements: ShapeData[];
}

interface BoardState {
    activeTool: ShapeType | 'select';
    activeColor: string;
    selectedElementId: string | null;
    elements: ShapeData[];
    history: HistoryEntry[];
    historyIndex: number;
    setTool: (tool: ShapeType | 'select') => void;
    setColor: (color: string) => void;
    setSelectedElement: (id: string | null) => void;
    setElements: (elements: ShapeData[]) => void;
    addElement: (element: ShapeData) => void;
    updateElement: (id: string, data: Partial<ShapeData>) => void;
    deleteElement: (id: string) => void;
    clearBoard: () => void;
    pushHistory: (action: HistoryAction) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    setHistory: (history: HistoryEntry[], index: number) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    activeTool: 'pencil',
    activeColor: '#000000',
    selectedElementId: null,
    elements: [],
    history: [],
    historyIndex: -1,
    setTool: (tool) => set({ activeTool: tool }),
    setColor: (color) => set({ activeColor: color }),
    setSelectedElement: (id) => set({ selectedElementId: id }),
    setElements: (elements) => set({ elements }),
    addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
    updateElement: (id, newData) => set((state) => ({
        elements: state.elements.map(el => el.id === id ? { ...el, ...newData } : el)
    })),
    deleteElement: (id) => set((state) => ({
        elements: state.elements.filter(el => el.id !== id)
    })),
    clearBoard: () => set({ elements: [] }),
    pushHistory: (action) => set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
            timestamp: Date.now(),
            action,
            elements: JSON.parse(JSON.stringify(state.elements))
        });
        return {
            history: newHistory,
            historyIndex: newHistory.length - 1
        };
    }),
    undo: () => set((state) => {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            const prevState = state.history[newIndex];
            return {
                elements: JSON.parse(JSON.stringify(prevState.elements)),
                historyIndex: newIndex
            };
        }
        return state;
    }),
    redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            const nextState = state.history[newIndex];
            return {
                elements: JSON.parse(JSON.stringify(nextState.elements)),
                historyIndex: newIndex
            };
        }
        return state;
    }),
    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    setHistory: (history, index) => set({ history, historyIndex: index })
}));
