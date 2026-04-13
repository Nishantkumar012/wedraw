import { useBoardStore } from '../../../store/useBoardStore';
import { Button } from '../../common/Button';
import { useState } from 'react';
import { Pencil, Square, Circle, Minus, Trash2, MousePointer2, UserPlus } from 'lucide-react';
import type { ShapeType } from '../../../types';
import { useLocation } from 'react-router-dom';

export const Sidebar = () => {
    const { activeTool, setTool, clearBoard } = useBoardStore();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
       const { state } = useLocation();
    const role = state?.role;

    console.log("role is", role)

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
               {role === "OWNER" && (<Button
                    variant='ghost'
                    size='icon'
                    className='text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                    onClick={() => setIsInviteOpen(true)}
                    >
                       <UserPlus size={20}/>
                </Button>)}

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
{isInviteOpen && role === "OWNER" && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    
    {/* Modal Box */}
    <div className="bg-white rounded-2xl shadow-lg p-6 w-96 relative">
      
      {/* Close button */}
      <button
        onClick={() => setIsInviteOpen(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">Invite User</h2>

      <input
        type="email"
        placeholder="Enter email"
        className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
         className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                >
         <option value="">Select Role</option>
          <option value="EDITOR">Editor</option>
           <option value="VIEWER">Viewer</option>
      </select>

      <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
        Send Invite
      </button>

    </div>
  </div>
)}
        </aside>
    );
};
