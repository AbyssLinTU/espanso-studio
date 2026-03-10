import { Handle, Position } from '@xyflow/react';
import { Type, Calendar, Terminal, FormInput, Clipboard, Shuffle, Hash, Link2 } from 'lucide-react';

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
    <div
      className={`w-[280px] bg-[#1C1C1F] rounded-xl border-2 transition-all duration-200 ${
        selected ? 'border-[#6366F1] shadow-lg shadow-indigo-500/20' : 'border-[#2D2D30] shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-[#2D2D30] border-2 border-[#0B0B0D] z-10"
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
      <div className="p-[20px] bg-[#121214]/50">
        <p className="text-[15px] font-bold text-[#D4D4D8]">{data.label}</p>
        <p className="text-[13px] text-[#71717A] mt-1.5 font-medium leading-relaxed">Configure in Properties Panel</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-[#6366F1] border-2 border-[#0B0B0D] z-10"
      />
    </div>
  );
};
