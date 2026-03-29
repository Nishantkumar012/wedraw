export type Point = {
    x: number;
    y: number;
};

export type ShapeType = 'pencil' | 'rectangle' | 'circle' | 'line';

export interface ShapeData {
    id: string;
    boardId: string;
    type: ShapeType;
    color: string;
    isTemp?: boolean;
    data: {
        color?: string;
        points?: Point[];
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
}
