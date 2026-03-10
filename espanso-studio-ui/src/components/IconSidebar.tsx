import { Home, Plus, RefreshCw, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

export const IconSidebar = () => {
  const { currentView, setCurrentView, resetEditor } = useStore();
  const [isRestarting, setIsRestarting] = useState(false);
  const { width } = useWindowSize();
  
  const isExpanded = width >= 900;

  const handleRestart = async () => {
    setIsRestarting(true);
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
    } finally {
      setIsRestarting(false);
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', action: () => setCurrentView('home'), active: currentView === 'home' },
    { id: 'editor', icon: Plus, label: 'New Macro', action: () => resetEditor(), active: currentView === 'editor' },
    { id: 'help', icon: BookOpen, label: 'Help & Guide', action: () => setCurrentView('help'), active: currentView === 'help' },
  ];

  return (
    <motion.aside 
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#09090B] h-full flex flex-col border-r border-[#2D2D30] select-none z-10 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className={`pt-6 pb-8 flex ${isExpanded ? 'px-6 items-center gap-3' : 'justify-center'}`}>
        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#818CF8] text-[15px] font-extrabold tracking-tight">
          ES
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-[#F4F4F5] font-bold text-[16px] whitespace-nowrap"
            >
              Espanso Studio
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Icons */}
      <div className={`flex flex-col gap-2 flex-1 ${isExpanded ? 'px-4' : 'items-center gap-3'}`}>
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: isExpanded ? 1.02 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={item.action}
            className={`rounded-xl flex items-center transition-colors duration-200 overflow-hidden ${
              isExpanded ? 'w-full h-11 px-3 gap-3 justify-start' : 'w-10 h-10 justify-center'
            } ${
              item.active
                ? 'bg-[#6366F1]/15 text-[#818CF8]'
                : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F]'
            }`}
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon className="w-[20px] h-[20px] shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium text-[14px] whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Bottom */}
      <div className={`pb-6 ${isExpanded ? 'px-4' : 'flex justify-center'}`}>
        <motion.button
          whileHover={{ scale: isExpanded ? 1.02 : 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          disabled={isRestarting}
          className={`rounded-xl flex items-center transition-colors duration-200 overflow-hidden text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#1C1C1F] ${
            isExpanded ? 'w-full h-11 px-3 gap-3 justify-start' : 'w-10 h-10 justify-center'
          }`}
          title={!isExpanded ? 'Restart Espanso' : undefined}
        >
          <motion.div
            animate={isRestarting ? { rotate: 360 } : { rotate: 0 }}
            transition={isRestarting ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            className="shrink-0"
          >
            <RefreshCw className="w-[20px] h-[20px]" strokeWidth={2} />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium text-[14px] whitespace-nowrap"
              >
                Restart Espanso
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
};
