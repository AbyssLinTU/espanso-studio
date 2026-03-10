import { Home, Plus, RefreshCw, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const IconSidebar = () => {
  const { currentView, setCurrentView, resetEditor } = useStore();

  const handleRestart = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      toast.promise(
        invoke('restart_espanso'),
        {
          loading: 'Restarting Espanso...',
          success: 'Success: Espanso Reloaded!',
          error: 'Error: Failed to restart'
        }
      );
    } catch (e) {
      console.error(e);
      toast.error('Error: Failed to restart');
    }
  };

  return (
    <aside className="w-16 min-w-[64px] bg-[#09090B] h-full flex flex-col items-center border-r border-[#2D2D30] select-none z-10">
      {/* Logo */}
      <div className="pt-6 pb-8">
        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#818CF8] text-[15px] font-extrabold tracking-tight">
          ES
        </div>
      </div>

      {/* Nav Icons */}
      <div className="flex flex-col items-center gap-3 flex-1">
        <button
          onClick={() => setCurrentView('home')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            currentView === 'home'
              ? 'bg-[#6366F1]/15 text-[#818CF8]'
              : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F]'
          }`}
          title="Home"
        >
          <Home className="w-[20px] h-[20px]" strokeWidth={2} />
        </button>

        <button
          onClick={() => resetEditor()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            currentView === 'editor'
              ? 'bg-[#6366F1]/15 text-[#818CF8]'
              : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F]'
          }`}
          title="New Macro"
        >
          <Plus className="w-[20px] h-[20px]" strokeWidth={2} />
        </button>

        <button
          onClick={() => setCurrentView('help')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            currentView === 'help'
              ? 'bg-[#6366F1]/15 text-[#818CF8]'
              : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F]'
          }`}
          title="Help & Guide"
        >
          <BookOpen className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>

      {/* Bottom */}
      <div className="pb-6">
        <button
          onClick={handleRestart}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F] transition-all duration-200"
          title="Restart Espanso"
        >
          <RefreshCw className="w-[20px] h-[20px]" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
};
