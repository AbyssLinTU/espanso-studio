import { useStore } from '../../store/useStore';
import { FileText, Settings, RefreshCw } from 'lucide-react';
import { EspansoService } from '../../services/EspansoService';

export const Sidebar = () => {
  const { fileList, activeFile, setActiveFile, editorMode, setEditorMode } = useStore();

  const handleRestart = async () => {
    try {
      await EspansoService.restart();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className="w-[270px] min-w-[270px] bg-[#111113] h-full flex flex-col border-r border-[#1F1F24] select-none">
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <Settings className="w-[22px] h-[22px] text-[#4F46E5]" strokeWidth={2} />
          <span className="text-[17px] font-bold tracking-tight text-white">
            Espanso Studio
          </span>
        </div>
      </div>

      {/* ── Mode Toggle ── */}
      <div className="px-4 pb-4">
        <div className="flex bg-[#0A0A0C] rounded-lg p-[3px] gap-[2px]">
          <button
            onClick={() => setEditorMode('quick')}
            className={`flex-1 py-[6px] text-[11px] font-semibold rounded-md transition-all duration-150 ${
              editorMode === 'quick'
                ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                : 'text-[#6B6B7A] hover:text-[#9A9AA8]'
            }`}
          >
            Quick Mode
          </button>
          <button
            onClick={() => setEditorMode('blueprint')}
            className={`flex-1 py-[6px] text-[11px] font-semibold rounded-md transition-all duration-150 ${
              editorMode === 'blueprint'
                ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                : 'text-[#6B6B7A] hover:text-[#9A9AA8]'
            }`}
          >
            Blueprint
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[#1F1F24] mx-4" />

      {/* ── File List ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2">
        <h2 className="text-[10px] font-bold text-[#5C5C6A] uppercase tracking-[0.12em] mb-2 px-2">
          Matches
        </h2>

        {fileList.length === 0 ? (
          <div className="px-2 text-[11px] text-[#5C5C6A]">No .yml files found.</div>
        ) : (
          <div className="space-y-[2px]">
            {fileList.map((file) => {
              const isActive = activeFile === file;
              return (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] rounded-lg transition-all duration-100 ${
                    isActive
                      ? 'bg-[rgba(79,70,229,0.12)] text-[#818CF8] font-semibold'
                      : 'text-[#9A9AA8] hover:bg-[#1A1A1E] hover:text-[#D0D0DA]'
                  }`}
                >
                  <FileText className={`w-[15px] h-[15px] ${isActive ? 'text-[#818CF8]' : 'text-[#5C5C6A]'}`} strokeWidth={1.8} />
                  <span className="truncate">{file}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Restart Button ── */}
      <div className="p-3 border-t border-[#1F1F24]">
        <button
          onClick={handleRestart}
          className="w-full flex items-center justify-center gap-2 py-[9px] bg-[#1A1A1E] hover:bg-[#222226] active:bg-[#2A2A30] text-[#9A9AA8] hover:text-white text-[12px] font-semibold rounded-lg border border-[#2A2A30] transition-all duration-150"
        >
          <RefreshCw className="w-[14px] h-[14px]" strokeWidth={2} />
          Restart Espanso
        </button>
      </div>
    </aside>
  );
};
