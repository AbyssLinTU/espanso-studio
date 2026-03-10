import { Eye, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export const LivePreview = () => {
  const { previewCollapsed, togglePreview, currentView, triggerText, replaceText } = useStore();

  return (
    <div className="h-full flex flex-col bg-[#121214] border-l border-[#2D2D30]">
      {/* Header */}
      <div className="h-[60px] shrink-0 flex items-center justify-between px-5 border-b border-[#2D2D30] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
            <Eye className="w-4 h-4 text-[#818CF8]" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold text-[#F4F4F5] uppercase tracking-wide">Live YAML Preview</span>
        </div>
        <button
          onClick={togglePreview}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#252529] transition-all"
        >
          <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${previewCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#09090B] p-5">
        <pre className="yaml-preview text-[14px] leading-relaxed text-[#A1A1AA] font-mono whitespace-pre-wrap">
          {currentView === 'editor' ? (
            <span className="text-[#F4F4F5]">
              <span className="text-[#6366F1]">matches:</span>{'\n'}
              {'  '}<span className="text-[#A1A1AA]">-</span> <span className="text-[#6366F1]">trigger:</span> <span className="text-[#10B981]">"{triggerText}"</span>{'\n'}
              {'    '}<span className="text-[#6366F1]">replace:</span> <span className="text-[#10B981]">"{replaceText}"</span>
            </span>
          ) : (
            `# Select a card or\n# create a new macro`
          )}
        </pre>
      </div>
    </div>
  );
};
