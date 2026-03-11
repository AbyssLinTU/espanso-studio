import { Search, Pencil, Trash2, Hash } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../../utils/animations';
import { useState, useRef, useEffect } from 'react';

export const HomeView = () => {
  const { macros, editMacro, deleteMacro } = useStore();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusSearch = () => {
      searchRef.current?.focus();
    };
    window.addEventListener('focus-search', handleFocusSearch);
    return () => window.removeEventListener('focus-search', handleFocusSearch);
  }, []);

  const filtered = macros.filter(
    (m) =>
      m.trigger.toLowerCase().includes(search.toLowerCase()) ||
      m.replace.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (macro: any) => {
    editMacro(macro);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0B0B0D] flex justify-center">
      <div className="w-full max-w-5xl px-[5%] md:px-[8%] xl:px-[10%] pt-12 sm:pt-20 pb-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 md:gap-0">
          <div>
            <h1 className="text-[clamp(1.5rem,5vw,2.25rem)] font-bold text-[#F4F4F5] tracking-tight flex items-baseline leading-none">
              My Matches <span className="text-[#71717A] text-[clamp(1rem,3vw,1.375rem)] font-semibold ml-2">({macros.length})</span>
            </h1>
            <p className="text-[#A1A1AA] text-[clamp(0.875rem,2vw,0.9375rem)] mt-3">Manage your expanding text snippets</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] w-5 h-5 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search triggers..."
              className="w-full pl-14 pr-5 py-3 bg-[#121214] border border-[#2D2D30] rounded-xl text-white placeholder-[#71717A] focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/20 transition-all shadow-sm text-[15px]"
            />
          </div>
        </div>

        {/* Card List */}
        <motion.div 
          className="flex flex-col gap-8 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-[#2D2D30] rounded-3xl bg-[#121214]/50"
            >
              <Search className="w-12 h-12 text-[#52525B] mb-4" />
              <p className="text-[17px] text-[#A1A1AA] font-medium">
                {macros.length === 0
                  ? "You haven't created any macros yet."
                  : "No matches found for your search."}
              </p>
              {macros.length === 0 && (
                <p className="text-[14px] text-[#71717A] mt-2">Click the + button in the sidebar to get started.</p>
              )}
            </motion.div>
          ) : (
            filtered.map((macro, i) => (
              <motion.div
                key={`${macro.trigger}-${i}`}
                variants={itemVariants}
                whileHover={{ 
                  y: -4, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
                }}
                className="group bg-[#121214] border border-[#27272A] rounded-2xl p-5 sm:p-8 hover:bg-[#1C1C1F] hover:border-[#3F3F46] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0"
              >
                <div className="min-w-0 flex-1 w-full sm:mr-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                    <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-[#6366F1]" strokeWidth={2.5} />
                    <span className="text-[18px] sm:text-[22px] font-bold text-[#F4F4F5] truncate tracking-wide">
                      {macro.trigger}
                    </span>
                  </div>
                  <div className="ml-0 sm:ml-10 bg-[#0B0B0D] border border-[#2D2D30] rounded-xl p-3 sm:p-4 text-[14px] sm:text-[16px] text-[#A1A1AA] line-clamp-2 sm:line-clamp-3 leading-relaxed font-mono w-full sm:max-w-[80%] shadow-inner">
                    {macro.replace}
                  </div>
                </div>
                
                {/* Action Buttons - Distinct separated layout */}
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleEdit(macro); }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1C1C1F] border border-[#2D2D30] text-[#A1A1AA] hover:text-white hover:bg-[#6366F1] hover:border-[#6366F1] transition-colors shadow-sm"
                    title="Edit Macro"
                  >
                    <motion.div whileHover={{ rotate: 15 }}>
                      <Pencil className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); deleteMacro(macro.trigger); }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1C1C1F] border border-[#2D2D30] text-[#A1A1AA] hover:text-white hover:bg-[#EF4444] hover:border-[#EF4444] transition-colors shadow-sm z-10 relative"
                    title="Delete Macro"
                  >
                    <motion.div whileHover={{ rotate: -15 }}>
                      <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
