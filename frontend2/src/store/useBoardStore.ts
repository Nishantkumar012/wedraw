import { create } from 'zustand';
import type { ShapeData, ShapeType } from '../types';

interface BoardState {
    activeTool: ShapeType | 'select';
    activeColor: string;
    selectedElementId: string | null;
    elements: ShapeData[];
    setTool: (tool: ShapeType | 'select') => void;
    setColor: (color: string) => void;
    setSelectedElement: (id: string | null) => void;
    setElements: (elements: ShapeData[]) => void;
    addElement: (element: ShapeData) => void;
    updateElement: (id: string, data: Partial<ShapeData>) => void;
    deleteElement: (id: string) => void;
    clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
    activeTool: 'pencil',
    activeColor: '#000000',
    selectedElementId: null,
    elements: [],
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
}));
