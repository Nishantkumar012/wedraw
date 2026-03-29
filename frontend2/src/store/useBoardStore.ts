import { create } from 'zustand';
import type { ShapeData, ShapeType } from '../types';

interface BoardState {
    activeTool: ShapeType | 'select';
    activeColor: string;
    elements: ShapeData[];
    setTool: (tool: ShapeType | 'select') => void;
    setColor: (color: string) => void;
    setElements: (elements: ShapeData[]) => void;
    addElement: (element: ShapeData) => void;
    updateElement: (id: string, data: Partial<ShapeData>) => void;
    clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
    activeTool: 'pencil',
    activeColor: '#000000',
    elements: [],
    setTool: (tool) => set({ activeTool: tool }),
    setColor: (color) => set({ activeColor: color }),
    setElements: (elements) => set({ elements }),
    addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
    updateElement: (id, newData) => set((state) => ({
        elements: state.elements.map(el => el.id === id ? { ...el, ...newData } : el)
    })),
    clearBoard: () => set({ elements: [] }),
}));
