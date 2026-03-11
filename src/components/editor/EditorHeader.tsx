import { Save, Info, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const EditorHeader = () => {
  const {
    triggerText, setTriggerText,
    triggerOptions, setTriggerOptions,
    editorMode, setEditorMode,
    saveMacro, setCurrentView,
    macros, originalTriggerText
  } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Check if current trigger is a duplicate of an existing one (excluding currently edited one)
  const isDuplicate = triggerText?.trim() !== '' && 
    macros.some(m => m.trigger === triggerText && m.trigger !== originalTriggerText);

  const handleSave = () => {
    setIsSaving(true);
    saveMacro();
    
    // Simulate slight network/fs delay for UI feedback
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }, 400);
  };

  return (
    <div className="flex items-center h-20 px-8 bg-[#0F0F11] border-b border-[#27272A] shrink-0 z-20 shadow-md relative gap-8">
      
      {/* Left Section: Title (Fixed Width) */}
      <div className="flex-none min-w-[160px]">
        <h1 className="text-xl font-bold text-[#F4F4F5] truncate">
          {editorMode === 'quick' ? 'Create Macro' : 'Blueprint Editor'}
        </h1>
      </div>

      {/* Center Section: Flexible Switcher Area */}
      <div className="flex-1 flex justify-center">
        <div className="flex bg-[#1E1E21] p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setEditorMode('quick')}
            className={`px-4 py-1.5 text-[13px] font-bold transition-all duration-200 shrink-0 rounded-lg ${
              editorMode === 'quick' ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/10' : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            Quick
          </button>
          <button
            onClick={() => setEditorMode('blueprint')}
            className={`px-4 py-1.5 text-[13px] font-bold transition-all duration-200 shrink-0 rounded-lg ${
              editorMode === 'blueprint' ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/10' : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            Blueprint
          </button>
        </div>
      </div>

      {/* Right Section: Workflow Tools (Fixed Content) */}
      <div className="flex-none flex items-center gap-4">
        
        {/* Trigger Input and Settings Group */}
        <div className="flex items-center gap-3 border-r border-[#2D2D30] pr-4 flex-none">
          <div className="flex flex-col relative">
            <div className="flex items-center gap-2 flex-none">
              <span className="text-[13px] text-[#71717A] font-semibold hidden sm:block">Trigger</span>
              <div className="relative">
                <input
                  type="text"
                  value={triggerText || ''}
                  onChange={(e) => setTriggerText(e.target.value)}
                  placeholder=":trigger"
                  className={`bg-[#151517] border rounded-lg px-3 py-1.5 w-[140px] md:w-[180px] text-[14px] font-bold text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none transition-all shadow-inner ${
                    isDuplicate ? 'border-[#F59E0B] focus:border-[#F59E0B]' : 'border-[#333338] focus:border-[#6366F1]'
                  }`}
                />
                {isDuplicate && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -top-6 right-0 text-[10px] font-bold text-[#F59E0B] uppercase flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    Duplicate (Overwrite)
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0B0D] rounded-lg px-3 py-1.5 border border-[#27272A] flex-none">
             <button 
                onClick={() => setTriggerOptions({ word: !triggerOptions.word })}
                className={`text-[11px] font-bold uppercase transition-all px-1.5 py-0.5 rounded ${triggerOptions.word ? 'bg-[#6366F1]/20 text-[#6366F1]' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
                title="Word Match"
              >
                Word
              </button>

              <button 
                onClick={() => setTriggerOptions({ case: !triggerOptions.case })}
                className={`text-[11px] font-bold uppercase transition-all px-1.5 py-0.5 rounded ${triggerOptions.case ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
                title="Case Sensitive"
              >
                Case
              </button>

              <button 
                onClick={() => setTriggerOptions({ prop_case: !triggerOptions.prop_case })}
                className={`text-[11px] font-bold uppercase transition-all px-1.5 py-0.5 rounded ${triggerOptions.prop_case ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
                title="Propagate Case"
              >
                Prop
              </button>

              <div className="w-px h-3 bg-[#2D2D30] mx-1" />
              
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentView('help')}
                className="text-[#52525B] hover:text-[#A1A1AA] transition-colors flex items-center justify-center p-0.5"
                title="What do these options mean?"
              >
                <Info className="w-3.5 h-3.5" />
              </motion.button>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[14px] font-bold h-[36px] min-w-[100px] px-4 rounded-lg transition-colors shadow-lg active:scale-95 shrink-0 overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#10B981]" />
                <span className="hidden sm:inline">Saved</span>
              </motion.div>
            ) : isSaving ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
            ) : (
              <motion.div
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

    </div>
  );
};
