import { Search, Pencil, Trash2, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export const HomeView = () => {
  const { macros, editMacro, deleteMacro } = useStore();
  const [search, setSearch] = useState('');

  const filtered = macros.filter(
    (m) =>
      m.trigger.toLowerCase().includes(search.toLowerCase()) ||
      m.replace.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (macro: any) => {
    editMacro(macro);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#0B0B0D] flex justify-center">
      <div className="w-full max-w-5xl px-6 md:px-12 xl:px-20 py-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-end w-full">
          <div>
            <h1 className="text-[36px] font-bold text-[#F4F4F5] tracking-tight flex items-baseline leading-none">
              My Matches <span className="text-[#71717A] text-[22px] font-semibold ml-3">({macros.length})</span>
            </h1>
            <p className="text-[#A1A1AA] text-[15px] mt-3">Manage your expanding text snippets</p>
          </div>
          <div className="relative w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search triggers..."
              className="w-full pl-12 pr-5 py-3 bg-[#121214] border border-[#2D2D30] rounded-xl text-white placeholder-[#71717A] focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/20 transition-all shadow-sm text-[15px]"
            />
          </div>
        </div>

        {/* Card List */}
        <div className="flex flex-col gap-8 w-full">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-[#2D2D30] rounded-3xl bg-[#121214]/50">
              <Search className="w-12 h-12 text-[#52525B] mb-4" />
              <p className="text-[17px] text-[#A1A1AA] font-medium">
                {macros.length === 0
                  ? "You haven't created any macros yet."
                  : "No matches found for your search."}
              </p>
              {macros.length === 0 && (
                <p className="text-[14px] text-[#71717A] mt-2">Click the + button in the sidebar to get started.</p>
              )}
            </div>
          ) : (
            filtered.map((macro, i) => (
              <div
                key={`${macro.trigger}-${i}`}
                className="group bg-[#121214] border border-[#27272A] rounded-2xl p-8 hover:bg-[#1C1C1F] hover:border-[#3F3F46] transition-all cursor-pointer shadow-sm hover:shadow-lg flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 mr-8">
                  <div className="flex items-center gap-4 mb-3">
                    <Hash className="w-6 h-6 text-[#6366F1]" strokeWidth={2.5} />
                    <span className="text-[22px] font-bold text-[#F4F4F5] truncate tracking-wide">
                      {macro.trigger}
                    </span>
                  </div>
                  <div className="ml-10 bg-[#0B0B0D] border border-[#2D2D30] rounded-xl p-4 text-[16px] text-[#A1A1AA] line-clamp-2 leading-relaxed font-mono w-full max-w-[80%] shadow-inner">
                    {macro.replace}
                  </div>
                </div>
                
                {/* Action Buttons - Distinct separated layout */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleEdit(macro)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1C1C1F] border border-[#2D2D30] text-[#A1A1AA] hover:text-white hover:bg-[#6366F1] hover:border-transparent transition-all shadow-sm"
                    title="Edit Macro"
                  >
                    <Pencil className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => deleteMacro(macro.trigger)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1C1C1F] border border-[#2D2D30] text-[#A1A1AA] hover:text-white hover:bg-[#EF4444] hover:border-transparent transition-all shadow-sm z-10 relative"
                    title="Delete Macro"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
