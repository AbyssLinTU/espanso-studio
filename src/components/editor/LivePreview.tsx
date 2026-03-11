import { Eye, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const LivePreview = () => {
  const { previewCollapsed, togglePreview, currentView, triggerText, replaceText, triggerOptions, variables } = useStore();

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
      <div className="flex-1 overflow-auto bg-[#09090B] p-6">
        <pre className="yaml-preview text-[13px] leading-relaxed font-mono">
          {currentView === 'editor' ? (
            <>
              <div className="text-[#6366F1] mb-1">matches:</div>
              <div className="flex">
                <span className="text-[#71717A] mr-2">-</span>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <span className="text-[#818CF8]">trigger:</span>
                    <span className="text-[#10B981]">"{triggerText || ''}"</span>
                  </div>

                  {/* Trigger Options */}
                  {triggerOptions.word && (
                    <div className="flex gap-2 ml-4">
                      <span className="text-[#818CF8]">word:</span>
                      <span className="text-[#F59E0B]">true</span>
                    </div>
                  )}
                  {triggerOptions.case && (
                    <div className="flex gap-2 ml-4">
                      <span className="text-[#818CF8]">case_sensitive:</span>
                      <span className="text-[#F59E0B]">true</span>
                    </div>
                  )}
                  {triggerOptions.prop_case && (
                    <div className="flex gap-2 ml-4">
                      <span className="text-[#818CF8]">propagate_case:</span>
                      <span className="text-[#F59E0B]">true</span>
                    </div>
                  )}

                  {/* Replace */}
                  <div className="flex gap-2 mt-1">
                    <span className="text-[#818CF8]">replace:</span>
                    {replaceText.includes('\n') ? (
                      <span className="text-[#F59E0B]">|-</span>
                    ) : (
                      <span className="text-[#10B981]">"{replaceText}"</span>
                    )}
                  </div>
                  {replaceText.includes('\n') && (
                    <div className="text-[#10B981] ml-4 whitespace-pre">
                      {replaceText.split('\n').map(line => `  ${line}`).join('\n')}
                    </div>
                  )}

                  {/* Variables */}
                  {variables.length > 0 && (
                    <div className="mt-1">
                      <div className="text-[#818CF8]">vars:</div>
                      {variables.map((v, i) => (
                        <div key={i} className="ml-4">
                          <div className="flex gap-2">
                            <span className="text-[#71717A]">-</span>
                            <span className="text-[#818CF8]">name:</span>
                            <span className="text-[#10B981]">{v.name}</span>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <span className="text-[#818CF8]">type:</span>
                            <span className="text-[#10B981]">{v.type}</span>
                          </div>
                          {Object.keys(v.params).length > 0 && (
                            <div className="ml-4">
                              <div className="text-[#818CF8]">params:</div>
                              {Object.entries(v.params).map(([pk, pv]) => (
                                <div key={pk} className="ml-4 flex gap-2">
                                  <span className="text-[#818CF8]">{pk}:</span>
                                  <span className="text-[#10B981]">"{pv}"</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-[#52525B] italic"># Configure macro to see preview</div>
          )}
        </pre>
      </div>
    </div>
  );
};
