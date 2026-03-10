import { create } from 'zustand';
import { toast } from 'sonner';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';

export type CurrentView = 'home' | 'editor' | 'help';
export type EditorMode = 'quick' | 'blueprint';

export interface MacroCard {
  trigger: string;
  replace: string;
  triggerOptions?: TriggerOptions;
  variables?: Variable[];
}

export interface TriggerOptions {
  word: boolean;
  case: boolean;
  prop_case: boolean;
}

export interface Variable {
  id: string;
  name: string;
  type: 'date' | 'shell' | 'clipboard' | 'form' | 'random' | 'script' | 'echo';
  params: Record<string, string>;
}

interface AppState {
  // Navigation
  currentView: CurrentView;
  editorMode: EditorMode;

  // Files
  activeFile: string | null;
  fileList: string[];

  // Macros for Home view
  macros: MacroCard[];

  // Editor state
  originalTriggerText: string | null;
  triggerText: string;
  triggerOptions: TriggerOptions;
  replaceText: string;
  variables: Variable[];

  // React Flow
  nodes: Node[];
  edges: Edge[];

  // Panels
  previewCollapsed: boolean;
  nodesCollapsed: boolean;
  propsCollapsed: boolean;

  // Error
  parserError: string | null;

  // Actions
  setCurrentView: (v: CurrentView) => void;
  setEditorMode: (m: EditorMode) => void;
  setActiveFile: (f: string | null) => void;
  setFileList: (files: string[]) => void;
  setMacros: (macros: MacroCard[]) => void;
  deleteMacro: (trigger: string) => void;
  editMacro: (macro: MacroCard) => void;
  resetEditor: () => void;
  setTriggerText: (t: string) => void;
  setTriggerOptions: (opts: Partial<TriggerOptions>) => void;
  setReplaceText: (t: string) => void;
  setVariables: (vars: Variable[]) => void;
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, key: string, value: string) => void;
  renameVariable: (id: string, newName: string) => void;
  removeVariable: (id: string) => void;
  reconcileVariables: () => void;
  setParserError: (e: string | null) => void;
  setPreviewCollapsed: (val: boolean) => void;
  setNodesCollapsed: (val: boolean) => void;
  setPropsCollapsed: (val: boolean) => void;
  togglePreview: () => void;
  toggleNodes: () => void;
  toggleProps: () => void;

  // Sync Actions
  syncQuickToBlueprint: () => void;
  syncBlueprintToQuick: () => void;
  
  // Save Actions
  saveMacro: () => void;

  // Flow
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, position: { x: number; y: number }, label?: string) => void;
  updateNodeData: (id: string, newData: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentView: 'home',
  editorMode: 'quick',

  activeFile: null,
  fileList: [],
  macros: [
    { trigger: ':br', replace: 'Best regards,\nJohn Doe\nSoftware Engineer' },
    { trigger: ':zoom', replace: 'Here is the link to our Zoom meeting: https://zoom.us/j/1234567890\nPasscode: 123456' },
    { trigger: ':email', replace: 'john.doe@example.com' },
    { trigger: ':address', replace: '123 Tech Boulevard\nSuite 400\nSan Francisco, CA 94105' },
    { trigger: ':lorem', replace: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
  ],

  originalTriggerText: null,
  triggerText: '',
  triggerOptions: { word: false, case: false, prop_case: false },
  replaceText: '',
  variables: [],

  nodes: [],
  edges: [],

  previewCollapsed: false,
  nodesCollapsed: false,
  propsCollapsed: false,

  parserError: null,

  setCurrentView: (v) => set({ currentView: v }),
  setEditorMode: (m) => {
    const s = get();
    if (s.editorMode === 'quick' && m === 'blueprint') {
      s.syncQuickToBlueprint();
    } else if (s.editorMode === 'blueprint' && m === 'quick') {
      s.syncBlueprintToQuick();
    }
    set({ editorMode: m });
  },
  setActiveFile: (f) => set({ activeFile: f }),
  setFileList: (files) => set({ fileList: files }),
  setMacros: (macros) => set({ macros }),

  deleteMacro: (trigger) => {
    const s = get();
    const newMacros = s.macros.filter(m => m.trigger !== trigger);
    set({ macros: newMacros });
    toast.success('Macro deleted');
    // Signal App.tsx to persist this to disk
    window.dispatchEvent(new CustomEvent('espanso-save'));
  },

  editMacro: (macro) => {
    set({
      originalTriggerText: macro.trigger,
      triggerText: macro.trigger,
      replaceText: macro.replace,
      triggerOptions: macro.triggerOptions || { word: false, case: false, prop_case: false },
      variables: macro.variables || [],
      editorMode: 'quick',
      currentView: 'editor'
    });
  },

  resetEditor: () => {
    set({
      originalTriggerText: null,
      triggerText: '',
      replaceText: '',
      triggerOptions: { word: false, case: false, prop_case: false },
      variables: [],
      editorMode: 'quick',
      currentView: 'editor'
    });
  },

  saveMacro: () => {
    const s = get();
    // Only in Quick Mode do we know replaceText is up-to-date linearly.
    // In Blueprint Mode, we need to sync Graph -> QuickText so save uses final data.
    if (s.editorMode === 'blueprint') {
      s.syncBlueprintToQuick();
    }
    
    // Defer saving just a tiny bit so sync BlueprintToQuick sets replaceText
    setTimeout(() => {
      const state = get();
      if (!state.triggerText.trim() || !state.replaceText.trim()) {
        toast.error('Trigger and replacement cannot be empty');
        return;
      }

      const newMacro: MacroCard = { 
        trigger: state.triggerText, 
        replace: state.replaceText,
        triggerOptions: state.triggerOptions,
        variables: state.variables
      };
      const existsIndex = state.originalTriggerText 
        ? state.macros.findIndex(m => m.trigger === state.originalTriggerText)
        : state.macros.findIndex(m => m.trigger === state.triggerText);
      
      let updatedMacros;
      if (existsIndex !== -1) {
        updatedMacros = [...state.macros];
        updatedMacros[existsIndex] = newMacro;
        toast.success('Macro updated successfully');
      } else {
        updatedMacros = [newMacro, ...state.macros];
        toast.success('Macro created successfully');
      }
      
      set({ 
        macros: updatedMacros,
        originalTriggerText: null,
        triggerText: '',
        replaceText: '',
        currentView: 'home' 
      });
      // Signal App.tsx to persist this to disk
      window.dispatchEvent(new CustomEvent('espanso-save'));
    }, 0);
  },
  setTriggerText: (t) => set({ triggerText: t }),
  setTriggerOptions: (opts) => set((s) => ({ triggerOptions: { ...s.triggerOptions, ...opts } })),
  setReplaceText: (t) => {
    set({ replaceText: t });
    get().reconcileVariables();
  },
  
  setVariables: (vars) => set({ variables: vars }),
  addVariable: (varObj) => {
    const vars = get().variables;
    if (!vars.find(v => v.id === varObj.id)) {
      set({ variables: [...vars, varObj] });
    }
  },
  updateVariable: (id, key, value) => {
    const vars = get().variables.map(v => 
      v.id === id ? { ...v, params: { ...v.params, [key]: value } } : v
    );
    set({ variables: vars });
  },
  renameVariable: (id, newName) => {
    const state = get();
    const targetVar = state.variables.find(v => v.id === id);
    if (!targetVar || !newName.trim()) return;

    const oldName = targetVar.name;
    if (oldName === newName) return;

    const newVars = state.variables.map(v => v.id === id ? { ...v, name: newName } : v);
    
    // Safely update replaceText
    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedOldName}\\}\\}`, 'g');
    const newText = state.replaceText.replace(regex, `{{${newName}}}`);

    set({ variables: newVars, replaceText: newText });
  },
  removeVariable: (id) => {
    set({ variables: get().variables.filter(v => v.id !== id) });
  },
  reconcileVariables: () => {
    const state = get();
    const activeVariableNames = new Set<string>();
    const matches = state.replaceText.matchAll(/\{\{([^}]+)\}\}/g);
    
    for (const match of matches) {
      activeVariableNames.add(match[1].trim());
    }

    // Keep only the variables whose placeholder name matches an active variable
    const cleanedVariables = state.variables.filter(v => 
      activeVariableNames.has(v.name)
    );

    if (cleanedVariables.length !== state.variables.length) {
      set({ variables: cleanedVariables });
    }
  },
  setParserError: (e) => set({ parserError: e }),
  setPreviewCollapsed: (val) => set({ previewCollapsed: val }),
  setNodesCollapsed: (val) => set({ nodesCollapsed: val }),
  setPropsCollapsed: (val) => set({ propsCollapsed: val }),
  togglePreview: () => set((s) => ({ previewCollapsed: !s.previewCollapsed })),
  toggleNodes: () => set((s) => ({ nodesCollapsed: !s.nodesCollapsed })),
  toggleProps: () => set((s) => ({ propsCollapsed: !s.propsCollapsed })),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (type, position, label) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'customNode', // using our specialized visual node
      position,
      data: { 
        label: label || type,
        nodeType: type // pass the specific icon/color behavior
      },
      selected: true,
    };
    
    // Deselect all others when adding new
    const currentNodes = get().nodes.map(n => ({ ...n, selected: false }));
    set({ nodes: [...currentNodes, newNode] });
  },
  updateNodeData: (id, newData) => {
    const s = get();
    const newNodes = s.nodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, ...newData } } : n
    );
    set({ nodes: newNodes });
    // Trigger sync after data update
    if (s.editorMode === 'blueprint') {
      get().syncBlueprintToQuick();
    }
  },

  syncQuickToBlueprint: () => {
    const { triggerText, replaceText } = get();
    
    // Always start with a Trigger node
    const triggerNode: Node = {
      id: `trigger-start`,
      type: 'customNode',
      position: { x: 100, y: 150 },
      data: { label: triggerText || ':keyword', nodeType: 'trigger', originalText: triggerText },
      selected: false,
    };

    const newNodes: Node[] = [triggerNode];
    const newEdges: Edge[] = [];
    let lastNodeId = triggerNode.id;
    let currentX = 450;

    // Fast split by {{variable}} allowing us to keep tokens
    const tokens = replaceText.split(/(\{\{[^}]+\}\})/g).filter(t => t);

    tokens.forEach((token, index) => {
      const isVariable = token.startsWith('{{') && token.endsWith('}}');
      let nodeType = 'T'; // Default Text Output
      let label = token; // Fallback plain text

      if (isVariable) {
        const varName = token.slice(2, -2).trim();
        const varConfig = get().variables.find(v => v.name === varName);

        if (varConfig) {
          if (varConfig.type === 'date') { nodeType = 'D'; label = 'Date Gen'; }
          else if (varConfig.type === 'shell') { nodeType = '$'; label = 'Shell Cmd'; }
          else if (varConfig.type === 'clipboard') { nodeType = 'C'; label = 'Clipboard'; }
          else if (varConfig.type === 'form') { nodeType = 'F'; label = 'Form Input'; }
          else if (varConfig.type === 'random') { nodeType = '?'; label = 'Random Pick'; }
          else if (varConfig.type === 'script') { nodeType = '#'; label = 'Python Script'; }
          else if (varConfig.type === 'echo') { nodeType = '&'; label = 'Concat'; }
        } else {
          nodeType = 'T'; label = `Var: ${varName}`; 
        }
      }

      const newNode: Node = {
        id: `node-${Date.now()}-${index}`,
        type: 'customNode',
        position: { x: currentX, y: 150 },
        data: { 
          label, 
          nodeType, 
          originalText: token,
          // Restore parameters from existing variables array
          varName: isVariable ? token.slice(2, -2).trim() : undefined,
          ...(isVariable ? (get().variables.find(v => v.name === token.slice(2, -2).trim())?.params || {}) : {}),
          // For Text Output nodes, the text is the token itself
          ...(nodeType === 'T' && !isVariable ? { text: token } : {})
        },
        selected: false,
      };

      newNodes.push(newNode);
      newEdges.push({
        id: `edge-${lastNodeId}-${newNode.id}`,
        source: lastNodeId,
        target: newNode.id,
      });

      lastNodeId = newNode.id;
      currentX += 350;
    });

    set({ nodes: newNodes, edges: newEdges });
  },

  syncBlueprintToQuick: () => {
    const { nodes, edges } = get();
    const triggerNode = nodes.find(n => n.data.nodeType === 'trigger');
    
    if (!triggerNode) return;
    
    // 1. Update Trigger Text
    if (triggerNode.data.label && triggerNode.data.label !== 'Trigger') {
      set({ triggerText: triggerNode.data.label as string });
    }

    let compiledText = '';
    let currentId = triggerNode.id;
    let visited = new Set<string>();
    const newVars: Variable[] = [];

    // Simple linear traversal for now (Concatenation pattern)
    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const edge = edges.find(e => e.source === currentId);
      if (!edge) break;

      const nextNode = nodes.find(n => n.id === edge.target);
      if (!nextNode) break;

      const nType = nextNode.data.nodeType;
      const nData = nextNode.data;

      if (nType === 'T') {
        compiledText += (nData.text || '');
      } else {
        // Variable nodes
        const varName = (nData.varName as string) || `var_${nextNode.id.split('-').pop()}`;
        compiledText += `{{${varName}}}`;

        // Map node properties to Espanso variable types
        let varType: Variable['type'] = 'date';
        let params: Record<string, string> = {};

        if (nType === 'D') { varType = 'date'; params = { format: (nData.format as string) || '%Y-%m-%d' }; }
        else if (nType === '$') { varType = 'shell'; params = { cmd: (nData.cmd as string) || 'echo "hello"' }; }
        else if (nType === 'C') { varType = 'clipboard'; params = {}; }
        else if (nType === 'F') { varType = 'form'; params = { title: (nData.title as string) || 'Input' }; }
        else if (nType === '?') { varType = 'random'; params = { choices: (nData.choices as string) || 'A,B,C' }; }
        else if (nType === '#') { varType = 'script'; params = { path: (nData.path as string) || 'script.py' }; }
        else if (nType === '&') { varType = 'echo'; params = { echo: (nData.echo as string) || 'concat' }; }

        newVars.push({
          id: nextNode.id,
          name: varName,
          type: varType,
          params
        });
      }

      currentId = nextNode.id;
    }

    set({ replaceText: compiledText, variables: newVars });
  },

}));
