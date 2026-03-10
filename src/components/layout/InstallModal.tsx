import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Download, X } from 'lucide-react';
import { EspansoService } from '../../services/EspansoService';
import { useState } from 'react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal = ({ isOpen, onClose }: InstallModalProps) => {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await EspansoService.install();
    } catch (e) {
      console.error(e);
    } finally {
      // We don't necessarily close because the installer runs in parallel
      // but we update the UI
      setIsInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1C1C1F] border border-[#2D2D30] rounded-2xl shadow-2xl p-8 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6366F1]/10 blur-[80px] rounded-full" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-[#71717A] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                <AlertTriangle size={32} />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-[#F4F4F5]">Espanso Not Found</h2>
                <p className="text-[14px] text-[#A1A1AA] leading-relaxed">
                  Espanso engine is required for this application to work. We can install it for you right now using the bundled installer.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full py-3 bg-[#6366F1] hover:bg-[#4F46E5] disabled:bg-[#1C1C1F] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {isInstalling ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download size={18} />
                      Install Now
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-transparent border border-[#2D2D30] text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#121214] rounded-xl font-semibold transition-all"
                >
                  I'll do it later
                </button>
              </div>
              
              <p className="text-[11px] text-[#52525B]">
                After installation, please restart Espanso Studio to apply changes.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
