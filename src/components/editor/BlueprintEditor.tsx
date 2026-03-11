import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Canvas } from './Canvas';
import { ReactFlowProvider } from '@xyflow/react';
import { EditorHeader } from './EditorHeader';
import { useWindowSize } from '../../hooks/useWindowSize';

const NODE_PALETTE = [
  { key: 'T', label: 'Text Output' },
  { key: 'D', label: 'Date Gen' },
  { key: '$', label: 'Shell Cmd' },
  { key: 'F', label: 'Form Input' },
  { key: 'C', label: 'Clipboard' },
  { key: '?', label: 'Random Pick' },
  { key: '#', label: 'Python Script' },
  { key: '&', label: 'Concat' },
];

export const BlueprintEditor = () => {
  const {
    triggerText, setTriggerText,
    triggerOptions, setTriggerOptions,
    nodesCollapsed, toggleNodes, setNodesCollapsed,
    propsCollapsed, toggleProps, setPropsCollapsed,
    nodes, addNode, updateNodeData,
  } = useStore();

  const { width } = useWindowSize();

  useEffect(() => {
    if (width < 1024) {
      if (!nodesCollapsed) setNodesCollapsed(true);
      if (!propsCollapsed) setPropsCollapsed(true);
    }
  }, [width, nodesCollapsed, propsCollapsed, setNodesCollapsed, setPropsCollapsed]);

  const selectedNode = nodes.find(n => n.selected);

  // Smart Routing: Inject start node when moving Quick -> Blueprint if empty
  useEffect(() => {
    if (nodes.length === 0) {
      addNode('trigger', { x: 100, y: 100 }, 'Trigger');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount of BlueprintEditor

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handlePaletteClick = (key: string) => {
    // Add roughly in center if clicked instead of dragged
    addNode(key, { x: 300, y: 200 });
  };

  if (width < 600) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#121214]">
        <EditorHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0B0D] text-center">
          <Wand2 className="w-12 h-12 text-[#EF4444] mb-4 opacity-80" />
          <h2 className="text-[18px] font-bold text-[#F4F4F5] mb-2">Window Too Small</h2>
          <p className="text-[#A1A1AA] text-[14px] max-w-[280px]">
            The Blueprint Editor requires more screen space. Please resize your window or switch to Quick mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121214]">
      <EditorHeader />

      {/* Workspace Three Panels - strictly 100vh minus exactly 80px (header) */}
      <div className="h-[calc(100vh-80px)] flex overflow-hidden">
        
        {/* Left: Nodes Palette (min-w-260px) */}
        <div
          className={`bg-[#121214] border-r border-[#27272A] flex flex-col transition-all duration-300 z-10 ${
            nodesCollapsed ? 'w-0 min-w-0 overflow-hidden border-r-0' : 'w-[260px] min-w-[260px]'
          }`}
        >
          {!nodesCollapsed && (
            <>
              <div className="h-14 flex items-center justify-between px-6 border-b border-[#2D2D30] shrink-0">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-[#6366F1]" strokeWidth={2.5} />
                  <span className="text-[15px] font-bold text-[#F4F4F5] uppercase tracking-wider">Nodes</span>
                </div>
                <button
                  onClick={toggleNodes}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1F] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-[13px] text-[#A1A1AA] font-medium mb-4 ml-1">Drag onto canvas or click</p>
                {NODE_PALETTE.map((node) => (
                  <div
                    key={node.key}
                    onClick={() => handlePaletteClick(node.key)}
                    onDragStart={(e) => onDragStart(e, node.key)}
                    draggable={true}
                    className="w-full text-left bg-[#1C1C1F] hover:bg-[#252529] border border-[#2D2D30] hover:border-[#6366F1] text-[14px] text-[#D4D4D8] hover:text-white px-4 py-3.5 rounded-xl transition-all shadow-sm cursor-grab active:cursor-grabbing font-bold flex items-center justify-between group active:scale-[0.98] active:shadow-inner select-none"
                  >
                    <div className="flex items-center gap-3 pointer-events-none">
                       <div className="w-1.5 h-6 bg-[#2D2D30] group-hover:bg-[#6366F1] rounded-full transition-colors shrink-0" />
                       <span>{node.label}</span>
                    </div>
                    <span className="text-[#6366F1] font-mono text-[16px] opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">[{node.key}]</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Nodes Expand Handle */}
        {nodesCollapsed && (
          <button
            onClick={toggleNodes}
            className="w-8 bg-[#121214] border-r border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1F] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Center: Canvas wrapped with Provider */}
        <div className="flex-1 relative w-full bg-[#0B0B0D]">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </div>

        {/* Props Expand Handle */}
        {propsCollapsed && (
          <button
            onClick={toggleProps}
            className="w-8 bg-[#121214] border-l border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1F] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right: Properties Panel (min-w-320px) */}
        <div
          className={`bg-[#121214] border-l border-[#27272A] flex flex-col transition-all duration-300 z-10 ${
            propsCollapsed ? 'w-0 min-w-0 overflow-hidden border-l-0' : 'w-[320px] min-w-[320px]'
          }`}
        >
          {!propsCollapsed && (
            <>
              <div className="h-14 flex items-center justify-between px-6 border-b border-[#2D2D30] shrink-0">
                <button
                  onClick={toggleProps}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1F] transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-[15px] font-bold text-[#F4F4F5] uppercase tracking-wider">Properties</span>
              </div>
              {selectedNode ? (
                <div className="flex-1 flex flex-col p-6 w-full text-[#F4F4F5] bg-[#0B0B0D]">
                  <h3 className="text-[16px] font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    {String(selectedNode.data.label)} Properties
                  </h3>
                  
                  {selectedNode.data.nodeType === 'trigger' ? (
                    <div className="flex flex-col gap-5">
                      <label className="flex flex-col gap-2">
                        <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Trigger Keyword</span>
                        <input
                          type="text"
                          value={triggerText}
                          onChange={(e) => {
                            setTriggerText(e.target.value);
                            updateNodeData(selectedNode.id, { label: e.target.value || 'Trigger' });
                          }}
                          className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[15px] font-bold focus:outline-none focus:border-[#6366F1]"
                        />
                      </label>
                      
                      <div className="h-px bg-[#2D2D30] my-2" />
                      
                      <div className="flex flex-col gap-3">
                        <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider mb-1">Options</span>
                        
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="hidden" checked={triggerOptions.word} onChange={(e) => setTriggerOptions({ word: e.target.checked })} />
                          <div className={`w-4 h-4 rounded border flex justify-center items-center transition-all ${triggerOptions.word ? 'bg-[#6366F1] border-[#6366F1]' : 'border-[#3F3F46] group-hover:border-[#52525B]'}`}>
                            {triggerOptions.word && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="text-[14px]">Word Match</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="hidden" checked={triggerOptions.case} onChange={(e) => setTriggerOptions({ case: e.target.checked })} />
                          <div className={`w-4 h-4 rounded border flex justify-center items-center transition-all ${triggerOptions.case ? 'bg-[#10B981] border-[#10B981]' : 'border-[#3F3F46] group-hover:border-[#52525B]'}`}>
                            {triggerOptions.case && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="text-[14px]">Case Sensitive</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="hidden" checked={triggerOptions.prop_case} onChange={(e) => setTriggerOptions({ prop_case: e.target.checked })} />
                          <div className={`w-4 h-4 rounded border flex justify-center items-center transition-all ${triggerOptions.prop_case ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[#3F3F46] group-hover:border-[#52525B]'}`}>
                            {triggerOptions.prop_case && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="text-[14px]">Propagate Case</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {/* Common Variable Name Field */}
                      {['D', '$', 'F', 'C', '?', '#', '&'].includes(selectedNode.data.nodeType as string) && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Variable Name</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[#6366F1] font-mono text-[14px] font-bold">{'{{'}</span>
                            <input
                              type="text"
                              value={(selectedNode.data.varName as string) || ''}
                              placeholder="unique_name"
                              onChange={(e) => updateNodeData(selectedNode.id, { varName: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                              className="bg-transparent border-b border-[#2D2D30] hover:border-[#3F3F46] focus:border-[#6366F1] focus:outline-none text-[#F4F4F5] font-mono text-[14px] w-full transition-colors"
                            />
                            <span className="text-[#6366F1] font-mono text-[14px] font-bold">{'}}'}</span>
                          </div>
                        </label>
                      )}

                      {/* Text Output Editor */}
                      {selectedNode.data.nodeType === 'T' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Static Text</span>
                          <textarea
                            value={(selectedNode.data.text as string) || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] h-32 resize-none focus:outline-none focus:border-[#6366F1] font-mono"
                            placeholder="Type text here..."
                          />
                        </label>
                      )}

                      {/* Date Format Editor */}
                      {selectedNode.data.nodeType === 'D' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Date Format</span>
                          <input
                            type="text"
                            value={(selectedNode.data.format as string) || '%Y-%m-%d'}
                            onChange={(e) => updateNodeData(selectedNode.id, { format: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#6366F1] font-mono"
                            placeholder="%Y-%m-%d"
                          />
                          <p className="text-[11px] text-[#71717A]">Examples: %Y-%m-%d, %H:%M</p>
                        </label>
                      )}

                      {/* Shell Command Editor */}
                      {selectedNode.data.nodeType === '$' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Shell Command</span>
                          <input
                            type="text"
                            value={(selectedNode.data.cmd as string) || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { cmd: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#6366F1] font-mono"
                            placeholder="echo 'hello'"
                          />
                        </label>
                      )}

                      {/* Form Field Editor */}
                      {selectedNode.data.nodeType === 'F' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Form Layout</span>
                          <input
                            type="text"
                            value={(selectedNode.data.layout as string) || (selectedNode.data.title ? `[[${selectedNode.data.title}]]` : '')}
                            onChange={(e) => updateNodeData(selectedNode.id, { layout: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#6366F1]"
                            placeholder="Prompt [[value]]"
                          />
                          <p className="text-[11px] text-[#71717A]">
                            Fields in brackets (e.g. [[value]]) can be accessed as {'{{'}{(selectedNode.data.varName as string) || 'var'}.value{'}}'}
                          </p>
                        </label>
                      )}

                      {/* Random Choices Editor */}
                      {selectedNode.data.nodeType === '?' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Choices (comma separated)</span>
                          <textarea
                            value={(selectedNode.data.choices as string) || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { choices: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] h-24 resize-none focus:outline-none focus:border-[#6366F1]"
                            placeholder="Choice 1, Choice 2, Choice 3"
                          />
                        </label>
                      )}

                      {/* Python Script Editor */}
                      {selectedNode.data.nodeType === '#' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Script Path / Name</span>
                          <input
                            type="text"
                            value={(selectedNode.data.path as string) || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { path: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#6366F1]"
                            placeholder="script.py"
                          />
                        </label>
                      )}

                      {/* Concat Editor */}
                      {selectedNode.data.nodeType === '&' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-[13px] text-[#A1A1AA] font-bold uppercase tracking-wider">Concat String</span>
                          <input
                            type="text"
                            value={(selectedNode.data.echo as string) || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { echo: e.target.value })}
                            className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#6366F1] font-mono"
                            placeholder="First {{name}} Last"
                          />
                        </label>
                      )}

                      <div className="bg-[#1C1C1F] border border-[#2D2D30] rounded-lg p-3 mt-4 opacity-50">
                        <span className="text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Node Debug</span>
                        <pre className="text-[10px] text-[#D4D4D8] mt-1 whitespace-pre-wrap font-mono">
                          ID: {selectedNode.id}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0B0D]">
                  <div className="w-16 h-16 rounded-2xl bg-[#1C1C1F] flex items-center justify-center border border-[#2D2D30] mb-4 shadow-sm">
                    <Wand2 className="w-8 h-8 text-[#52525B]" />
                  </div>
                  <p className="text-[15px] text-[#A1A1AA] text-center font-medium leading-relaxed">
                    Select a node on the canvas<br />to edit its properties.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};
