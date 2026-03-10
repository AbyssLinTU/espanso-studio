import { Save, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

export const EditorHeader = () => {
  const {
    triggerText, setTriggerText,
    triggerOptions, setTriggerOptions,
    editorMode, setEditorMode,
    saveMacro,
  } = useStore();

  return (
    <div className="flex justify-between items-center h-20 px-10 bg-[#0F0F11] border-b border-[#27272A] shrink-0 z-20 shadow-md relative">
      
      {/* Left: Dynamic Title */}
      <h1 className="text-2xl font-bold text-[#F4F4F5] truncate max-w-[300px]">
        {editorMode === 'quick' ? 'Create Macro' : (
          <>Blueprint: <span className="text-[#A1A1AA] font-normal">{triggerText || 'Untitled'}</span></>
        )}
      </h1>

      {/* Center: Mode Switcher */}
      <div className="flex bg-[#1E1E21] p-1 rounded-xl gap-1 absolute left-1/2 -translate-x-1/2">
        <button
          onClick={() => setEditorMode('quick')}
          className={`px-4 py-1.5 text-[14px] font-bold transition-all duration-200 ${
            editorMode === 'quick'
              ? 'bg-[#6366F1] text-white rounded-lg shadow-lg'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          Quick Text
        </button>
        <button
          onClick={() => setEditorMode('blueprint')}
          className={`px-4 py-1.5 text-[14px] font-bold transition-all duration-200 ${
            editorMode === 'blueprint'
              ? 'bg-[#6366F1] text-white rounded-lg shadow-lg'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          Blueprint Mode
        </button>
      </div>

      {/* Right: Trigger Input & Save Button */}
      <div className="flex items-center gap-6">
        
        {/* Trigger Input and Settings Group */}
        <div className="flex items-center gap-4 border-r border-[#2D2D30] pr-6">
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-[#A1A1AA] font-semibold">Trigger</span>
            <input
              type="text"
              value={triggerText}
              onChange={(e) => setTriggerText(e.target.value)}
              placeholder=":keyword"
              className="bg-[#151517] border border-[#2D2D30] rounded-lg px-3 py-1.5 w-48 text-[15px] font-bold text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 bg-[#0B0B0D] rounded-lg px-4 py-1.5 border border-[#27272A]">
             <label className="flex items-center gap-1.5 cursor-pointer group" title="Word Match">
                <input type="checkbox" className="hidden" checked={triggerOptions.word} onChange={(e) => setTriggerOptions({ word: e.target.checked })} />
                <span className={`text-[12px] font-bold uppercase transition-colors ${triggerOptions.word ? 'text-[#6366F1]' : 'text-[#52525B] group-hover:text-[#A1A1AA]'}`}>Word</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer group" title="Case Sensitive">
                <input type="checkbox" className="hidden" checked={triggerOptions.case} onChange={(e) => setTriggerOptions({ case: e.target.checked })} />
                <span className={`text-[12px] font-bold uppercase transition-colors ${triggerOptions.case ? 'text-[#10B981]' : 'text-[#52525B] group-hover:text-[#A1A1AA]'}`}>Case</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer group" title="Propagate Case">
                <input type="checkbox" className="hidden" checked={triggerOptions.prop_case} onChange={(e) => setTriggerOptions({ prop_case: e.target.checked })} />
                <span className={`text-[12px] font-bold uppercase transition-colors ${triggerOptions.prop_case ? 'text-[#F59E0B]' : 'text-[#52525B] group-hover:text-[#A1A1AA]'}`}>Prop</span>
              </label>

              <div className="w-px h-4 bg-[#2D2D30] mx-1" />
              
              <a 
                href="https://espanso.org/docs/matches/options/" 
                target="_blank" 
                rel="noreferrer"
                className="text-[#52525B] hover:text-[#A1A1AA] transition-colors flex items-center justify-center p-1"
                title="What do these options mean?"
              >
                <Info className="w-4 h-4" />
              </a>
          </div>
        </div>

        <button 
          onClick={saveMacro}
          className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[15px] font-medium px-6 py-2 rounded-lg transition-all shadow-lg active:scale-95 shrink-0"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

    </div>
  );
};
