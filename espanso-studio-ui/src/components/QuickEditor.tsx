import { FileEdit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EditorHeader } from './EditorHeader';

const QUICK_ADD_BUTTONS = [
  { key: 'D', baseName: 'date', label: 'Date', type: 'date' as const },
  { key: '$', baseName: 'shell', label: 'Shell', type: 'shell' as const },
  { key: 'C', baseName: 'clipboard', label: 'Clipboard', type: 'clipboard' as const },
  { key: 'F', baseName: 'form', label: 'Form', type: 'form' as const },
  { key: '?', baseName: 'random', label: 'Random', type: 'random' as const },
];

export const QuickEditor = () => {
  const {
    replaceText, setReplaceText,
    variables, addVariable, updateVariable, removeVariable, renameVariable
  } = useStore();

  const insertSnippet = (btn: typeof QUICK_ADD_BUTTONS[0]) => {
    let baseName = btn.baseName;
    if (btn.type === 'shell') baseName = 'output'; 
    let varName = baseName;
    let counter = 1;

    // ensure unique variable name if adding multiple of the same type
    while (variables.find(v => v.name === varName)) {
      counter++;
      varName = `${baseName}${counter}`;
    }

    const varId = `var_${Math.floor(Math.random() * 10000)}`;
    const snippetToInsert = `{{${varName}}}`;
    
    setReplaceText(replaceText + snippetToInsert);
    
    if (btn.type === 'date') addVariable({ id: varId, name: varName, type: 'date', params: { format: '%Y-%m-%d' } });
    else if (btn.type === 'shell') addVariable({ id: varId, name: varName, type: 'shell', params: { cmd: 'echo "Hello"' } });
    else if (btn.type === 'clipboard') addVariable({ id: varId, name: varName, type: 'clipboard', params: {} });
    else if (btn.type === 'random') addVariable({ id: varId, name: varName, type: 'random', params: { choices: 'A,B,C' } });
    else if (btn.type === 'form') addVariable({ id: varId, name: varName, type: 'form', params: { title: 'User Input' } });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0B0D] overflow-hidden">
      <EditorHeader />

      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-5xl px-6 md:px-12 xl:px-20 py-10 mt-8 flex flex-col gap-8">
          
          {/* Editor Area */}
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-10 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-[#2D2D30] pb-4">
            <FileEdit className="w-6 h-6 text-[#6366F1]" strokeWidth={2.5} />
            <div>
              <h3 className="text-[18px] font-bold text-[#F4F4F5]">Replacement Snippet</h3>
              <p className="text-[14px] text-[#A1A1AA] mt-0.5">Define your expansion text and insert dynamic variables</p>
            </div>
          </div>
          
          <textarea
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Hello, my name is {{clipboard}}!"
            className="w-full h-48 bg-[#0B0B0D] border border-[#2D2D30] rounded-xl p-6 text-[16px] text-[#F4F4F5] placeholder:text-[#52525B] resize-none focus:outline-none focus:border-[#6366F1] leading-relaxed font-mono shadow-inner"
            spellCheck={false}
          />
        </div>

        {/* Quick Add Variables */}
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
           <span className="text-[14px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2">Insert Variables:</span>
           <div className="flex flex-wrap gap-3">
            {QUICK_ADD_BUTTONS.map((btn) => (
              <button
                key={btn.key}
                onClick={() => insertSnippet(btn)}
                className="bg-[#1C1C1F] border border-[#3F3F46] hover:border-[#6366F1] hover:bg-[#6366F1]/10 text-[#D4D4D8] hover:text-white px-4 py-2 rounded-xl transition-all font-semibold text-[14px] flex items-center gap-2"
              >
                <span className="text-[#6366F1] opacity-80">[{btn.key}]</span>
                {btn.label}
              </button>
            ))}
           </div>
        </div>

        {/* Variable Settings */}
        {variables.length > 0 && (
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 shadow-sm flex flex-col gap-6">
            <span className="text-[14px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2">Variable Settings (Extensions)</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map(ext => (
                <div key={ext.id} className="bg-[#1C1C1F] border border-[#2D2D30] rounded-xl p-5 flex flex-col gap-4 relative group">
                  <button 
                    onClick={() => removeVariable(ext.id)}
                    className="absolute top-4 right-4 text-[#71717A] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove variable"
                  >
                    ×
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-[#6366F1] font-mono text-[15px] font-bold">{'{{'}</span>
                    <input 
                      type="text"
                      value={ext.name}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                        renameVariable(ext.id, val);
                      }}
                      className="bg-transparent border-b border-transparent hover:border-[#3F3F46] focus:border-[#6366F1] focus:outline-none text-[#6366F1] font-mono text-[15px] font-bold w-full max-w-[120px] transition-colors p-0 text-center"
                    />
                    <span className="text-[#6366F1] font-mono text-[15px] font-bold">{'}}'}</span>
                    <span className="ml-3 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider bg-[#2D2D30] px-2 py-1 rounded-md">{ext.type}</span>
                  </div>
                  
                  {ext.type === 'date' && (
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] text-[#A1A1AA] font-semibold">Format String</span>
                      <input 
                        type="text" 
                        value={ext.params.format || ''} 
                        onChange={(e) => updateVariable(ext.id, 'format', e.target.value)} 
                        className="bg-[#121214] border border-[#3F3F46] rounded-md px-3 py-2 text-[14px] text-[#F4F4F5] focus:border-[#6366F1] outline-none" 
                        placeholder="%Y-%m-%d"
                      />
                      <p className="text-[11px] text-[#71717A]">Examples: %Y-%m-%d, %H:%M:%S</p>
                    </label>
                  )}

                  {ext.type === 'shell' && (
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] text-[#A1A1AA] font-semibold">Shell Command</span>
                      <input 
                        type="text" 
                        value={ext.params.cmd || ''} 
                        onChange={(e) => updateVariable(ext.id, 'cmd', e.target.value)} 
                        className="bg-[#121214] border border-[#3F3F46] rounded-md px-3 py-2 text-[14px] text-[#F4F4F5] font-mono focus:border-[#6366F1] outline-none" 
                        placeholder="echo 'Hello'"
                      />
                    </label>
                  )}

                  {ext.type === 'random' && (
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] text-[#A1A1AA] font-semibold">Choices (Comma separated)</span>
                      <input 
                        type="text" 
                        value={ext.params.choices || ''} 
                        onChange={(e) => updateVariable(ext.id, 'choices', e.target.value)} 
                        className="bg-[#121214] border border-[#3F3F46] rounded-md px-3 py-2 text-[14px] text-[#F4F4F5] focus:border-[#6366F1] outline-none" 
                        placeholder="Choice 1, Choice 2, Choice 3"
                      />
                    </label>
                  )}

                  {['clipboard', 'form'].includes(ext.type) && (
                     <p className="text-[13px] text-[#71717A] italic">No advanced configuration required for this type.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link removed because of EditorHeader */}

        </div>
      </div>
    </div>
  );
};
