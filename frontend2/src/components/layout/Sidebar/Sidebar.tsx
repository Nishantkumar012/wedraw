import { useBoardStore } from '../../../store/useBoardStore';
import { Button } from '../../common/Button';
import { Pencil, Square, Circle, Minus, Trash2, MousePointer2 } from 'lucide-react';
import type { ShapeType } from '../../../types';

export const Sidebar = () => {
    const { activeTool, setTool, clearBoard } = useBoardStore();

    const tools: { id: ShapeType | 'select'; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
        { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
        { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
        { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
        { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    ];

    return (
        <aside className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 shadow-sm z-10">
            <div className="flex flex-col gap-2">
                {tools.map((tool) => (
                    <Button
                        key={tool.id}
                        variant={activeTool === tool.id ? 'primary' : 'ghost'}
                        size="icon"
                        onClick={() => setTool(tool.id)}
                        title={tool.label}
                    >
                        {tool.icon}
                    </Button>
                ))}
            </div>

            <div className="mt-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearBoard}
                    title="Clear Board"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    <Trash2 size={20} />
                </Button>
            </div>
        </aside>
    );
};
