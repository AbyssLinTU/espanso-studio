import { Handle, Position } from '@xyflow/react';
import { Type, Calendar, Terminal, FormInput, Clipboard, Shuffle, Hash, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  trigger: { icon: Type, color: '#10B981', label: 'Trigger' }, // Emerald
  T: { icon: Type, color: '#6366F1', label: 'Text Output' }, // Indigo
  D: { icon: Calendar, color: '#8B5CF6', label: 'Date Gen' }, // Violet
  $: { icon: Terminal, color: '#F97316', label: 'Shell Cmd' }, // Orange
  F: { icon: FormInput, color: '#EC4899', label: 'Form Input' }, // Pink
  C: { icon: Clipboard, color: '#3B82F6', label: 'Clipboard' }, // Blue
  '?': { icon: Shuffle, color: '#14B8A6', label: 'Random Pick' }, // Teal
  '#': { icon: Hash, color: '#EAB308', label: 'Python Script' }, // Yellow
  '&': { icon: Link2, color: '#64748B', label: 'Concat' }, // Slate
};

export const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const tConfig = TYPE_CONFIG[data.nodeType] || TYPE_CONFIG['T'];
  const Icon = tConfig.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        boxShadow: selected ? `0 0 0 2px ${tConfig.color}, 0 0 25px -5px ${tConfig.color}80` : '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        background: 'rgba(28, 28, 31, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
      className={`w-[260px] rounded-2xl border transition-all duration-300 ${
        selected ? 'border-transparent z-50 relative' : 'border-[#2D2D30]/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !bg-[#2D2D30] !border-2 !border-[#0B0B0D] hover:!bg-[#6366F1] hover:!border-[#4F46E5] transition-colors z-10 !-ml-2.5"
      />

      {/* Colored Header Bar */}
      <div 
        className="px-5 py-3 flex items-center gap-3 border-b border-[#2D2D30] rounded-t-[10px]"
        style={{ backgroundColor: `${tConfig.color}15` }} // 15% opacity
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${tConfig.color}20`, color: tConfig.color }}>
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-bold text-[#F4F4F5] uppercase tracking-wider">{tConfig.label}</span>
      </div>

      {/* Node Body */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
           <span className="text-[11px] text-[#71717A] uppercase font-bold tracking-widest">Preview</span>
           {data.varName && (
             <span className="text-[#6366F1] font-mono text-[10px] bg-[#6366F1]/10 px-1.5 py-0.5 rounded">
               {`{{${data.varName}}}`}
             </span>
           )}
        </div>
        
        <div className="min-h-[40px] flex flex-col justify-center">
          {data.nodeType === 'T' && (
            <p className="text-[14px] text-[#F4F4F5] line-clamp-2 font-medium italic opacity-80">
              "{data.text || 'Empty text'}"
            </p>
          )}
          {data.nodeType === 'D' && (
            <p className="text-[14px] text-[#8B5CF6] font-mono font-bold">
              {data.format || '%Y-%m-%d'}
            </p>
          )}
          {data.nodeType === '$' && (
            <div className="bg-[#0B0B0D] rounded-lg p-2 border border-[#2D2D30]">
               <p className="text-[12px] text-[#F97316] font-mono truncate">
                 $ {data.cmd || 'echo ...'}
               </p>
            </div>
          )}
          {data.nodeType === 'F' && (
            <p className="text-[14px] text-[#EC4899] font-bold">
              [{data.title || 'Input Field'}]
            </p>
          )}
          {data.nodeType === '?' && (
             <p className="text-[13px] text-[#14B8A6] truncate italic">
               Options: {data.choices || '...'}
             </p>
          )}
          {data.nodeType === 'C' && (
             <p className="text-[13px] text-[#3B82F6] font-medium italic">
               System Clipboard
             </p>
          )}
          {data.nodeType === '#' && (
            <div className="bg-[#0B0B0D] rounded-lg p-2 border border-[#2D2D30]">
               <p className="text-[12px] text-[#EAB308] font-mono truncate">
                 # {data.path || 'empty path...'}
               </p>
            </div>
          )}
          {data.nodeType === '&' && (
            <p className="text-[14px] text-[#64748B] font-bold line-clamp-2">
              Concat: {data.echo || '...'}
            </p>
          )}
          {data.nodeType === 'trigger' && (
             <p className="text-[16px] text-[#F4F4F5] font-black tracking-tight">
               {data.label}
             </p>
          )}
        </div>
        
        {!['trigger', 'T', 'D', '$', 'F', '?', 'C', '#', '&'].includes(data.nodeType) && (
           <p className="text-[13px] text-[#71717A] italic">Click to configure</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !bg-[#6366F1] !border-2 !border-[#0B0B0D] hover:!bg-[#8B5CF6] hover:!border-[#7C3AED] transition-colors z-10 !-mr-2.5"
      />
    </motion.div>
  );
};
