import { Handle, Position, useStore as useFlowStore } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export const TemplateNode = ({ id, data }: NodeProps) => {
  const incomingEdges = useFlowStore((s) =>
    s.edges.filter((e) => e.target === id)
  );

  const handleCount = incomingEdges.length + 1;
  const handles = Array.from({ length: handleCount }).map((_, i) => `in-${i + 1}`);

  return (
    <div className="bg-[#212124] border border-[#333338] rounded-xl shadow-lg min-w-[150px] relative">
      <div className="bg-[#333338] p-2 text-white text-xs font-bold rounded-t-xl text-center">
        {(data as any).label || 'Concat/Template'}
      </div>

      <div className="p-3">
        <div className="text-gray-400 text-xs">Variables:</div>
        {handles.map((handleId, index) => {
          const topPosition = 40 + index * 20;
          return (
            <div key={handleId} className="relative h-5">
              <span className="text-[10px] text-gray-500 ml-2">Var {index + 1}</span>
              <Handle
                type="target"
                position={Position.Left}
                id={handleId}
                className="w-[10px] h-[10px] !bg-[#9CA3AF] !border-[#E1E1E6]"
                style={{ top: topPosition }}
              />
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="w-[10px] h-[10px] !bg-[#5865F2] !border-[#E1E1E6]"
      />
    </div>
  );
};
