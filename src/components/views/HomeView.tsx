import { Search, Pencil, Trash2, Hash, Folder, FolderOpen } from 'lucide-react';
import { useStore, type MacroCard } from '../../store/useStore';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../../utils/animations';
import { useState, useRef, useEffect, useMemo, memo } from 'react';

interface FolderTabProps {
  label: string;
  count: number;
  isSelected: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}

const FolderTab = memo(({ label, count, isSelected, icon, onClick }: FolderTabProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 shrink-0 ${
      isSelected
        ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20'
        : 'bg-[#121214] text-[#A1A1AA] border border-[#27272A] hover:bg-[#1C1C1F] hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-black/20 text-[11px]">
      {count}
    </span>
  </button>
));

FolderTab.displayName = 'FolderTab';

interface MacroCardItemProps {
  macro: MacroCard;
  onEdit: (macro: MacroCard) => void;
  onDelete: (trigger: string) => void;
}

const MacroCardItem = memo(({ macro, onEdit, onDelete }: MacroCardItemProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ 
      y: -4, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
    }}
    className="group bg-[#121214] border border-[#27272A] rounded-2xl p-5 sm:p-8 hover:bg-[#1C1C1F] hover:border-[#3F3F46] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0"
  >
    <div className="min-w-0 flex-1 w-full sm:mr-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-3 flex-wrap">
        <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-[#6366F1]" strokeWidth={2.5} />
        <span className="text-[18px] sm:text-[22px] font-bold text-[#F4F4F5] truncate tracking-wide">
          {macro.trigger}
        </span>

        {macro.folder && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#818CF8] text-[12px] font-medium ml-1">
            <Folder className="w-3.5 h-3.5" />
            {macro.folder}
          </span>
        )}
      </div>
      <div className="ml-0 sm:ml-10 bg-[#0B0B0D] border border-[#2D2D30] rounded-xl p-3 sm:p-4 text-[14px] sm:text-[16px] text-[#A1A1AA] line-clamp-2 sm:line-clamp-3 leading-relaxed font-mono w-full sm:max-w-[80%] shadow-inner">
        {macro.replace}
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); onEdit(macro); }}
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
        onClick={(e) => { e.stopPropagation(); onDelete(macro.trigger); }}
        className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1C1C1F] border border-[#2D2D30] text-[#A1A1AA] hover:text-white hover:bg-[#EF4444] hover:border-[#EF4444] transition-colors shadow-sm z-10 relative"
        title="Delete Macro"
      >
        <motion.div whileHover={{ rotate: -15 }}>
          <Trash2 className="w-5 h-5" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </div>
  </motion.div>
));

MacroCardItem.displayName = 'MacroCardItem';

export const HomeView = () => {
  const { macros, editMacro, deleteMacro } = useStore();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusSearch = () => {
      searchRef.current?.focus();
    };
    window.addEventListener('focus-search', handleFocusSearch);
    return () => window.removeEventListener('focus-search', handleFocusSearch);
  }, []);

  // Extract unique folders from macros
  const folders = useMemo(() => {
    const set = new Set<string>();
    macros.forEach((m) => {
      if (m.folder && m.folder.trim()) {
        set.add(m.folder.trim());
      }
    });
    return Array.from(set).sort();
  }, [macros]);

  // Count uncategorized macros
  const uncategorizedCount = useMemo(() => {
    return macros.filter((m) => !m.folder || !m.folder.trim()).length;
  }, [macros]);

  // Filter macros by search query AND selected folder
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return macros.filter((m) => {
      const matchSearch =
        !query ||
        m.trigger.toLowerCase().includes(query) ||
        m.replace.toLowerCase().includes(query) ||
        (m.folder && m.folder.toLowerCase().includes(query));

      if (!matchSearch) return false;

      if (selectedFolder === 'all') return true;
      if (selectedFolder === 'uncategorized') return !m.folder || !m.folder.trim();
      return m.folder === selectedFolder;
    });
  }, [macros, search, selectedFolder]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0B0B0D] flex justify-center">
      <div className="w-full max-w-5xl px-[5%] md:px-[8%] xl:px-[10%] pt-12 sm:pt-20 pb-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 md:gap-0">
          <div>
            <h1 className="text-[clamp(1.5rem,5vw,2.25rem)] font-bold text-[#F4F4F5] tracking-tight flex items-baseline leading-none">
              My Matches <span className="text-[#71717A] text-[clamp(1rem,3vw,1.375rem)] font-semibold ml-2">({filtered.length})</span>
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
              placeholder="Search triggers or folders..."
              className="w-full pl-14 pr-5 py-3 bg-[#121214] border border-[#2D2D30] rounded-xl text-white placeholder-[#71717A] focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/20 transition-all shadow-sm text-[15px]"
            />
          </div>
        </div>

        {/* Folder Filter Tabs (If folders exist) */}
        {folders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <FolderTab
              label="All Macros"
              count={macros.length}
              isSelected={selectedFolder === 'all'}
              icon={<FolderOpen className="w-4 h-4" />}
              onClick={() => setSelectedFolder('all')}
            />

            {folders.map((folderName) => {
              const count = macros.filter((m) => m.folder === folderName).length;
              return (
                <FolderTab
                  key={folderName}
                  label={folderName}
                  count={count}
                  isSelected={selectedFolder === folderName}
                  icon={<Folder className="w-4 h-4 text-[#818CF8]" />}
                  onClick={() => setSelectedFolder(folderName)}
                />
              );
            })}

            {uncategorizedCount > 0 && (
              <FolderTab
                label="Uncategorized"
                count={uncategorizedCount}
                isSelected={selectedFolder === 'uncategorized'}
                onClick={() => setSelectedFolder('uncategorized')}
              />
            )}
          </div>
        )}

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
                  : "No matches found for your search/filter."}
              </p>
              {macros.length === 0 && (
                <p className="text-[14px] text-[#71717A] mt-2">Click the + button in the sidebar to get started.</p>
              )}
            </motion.div>
          ) : (
            filtered.map((macro, i) => (
              <MacroCardItem
                key={`${macro.trigger}-${i}`}
                macro={macro}
                onEdit={editMacro}
                onDelete={deleteMacro}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
