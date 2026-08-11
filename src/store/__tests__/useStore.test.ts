import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, type MacroCard } from '../useStore';

describe('useStore - Zustand State Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      currentView: 'home',
      editorMode: 'quick',
      macros: [],
      triggerText: '',
      replaceText: '',
      variables: [],
      nodes: [],
      edges: [],
      past: [],
      future: [],
    });
  });

  it('should initialize with default state', () => {
    const state = useStore.getState();
    expect(state.currentView).toBe('home');
    expect(state.editorMode).toBe('quick');
    expect(state.macros).toHaveLength(0);
  });

  it('should set macros and delete macro by trigger', () => {
    const sampleMacros: MacroCard[] = [
      { trigger: ':m1', replace: 'Macro 1', folder: 'Work' },
      { trigger: ':m2', replace: 'Macro 2', folder: 'Personal' },
    ];

    useStore.getState().setMacros(sampleMacros);
    expect(useStore.getState().macros).toHaveLength(2);

    useStore.getState().deleteMacro(':m1');
    expect(useStore.getState().macros).toHaveLength(1);
    expect(useStore.getState().macros[0].trigger).toBe(':m2');
  });

  it('should handle editing a macro', () => {
    const macro: MacroCard = {
      trigger: ':test',
      replace: 'Test Replace',
      folder: 'General',
      triggerOptions: { word: true, case: false, prop_case: false },
      variables: [],
    };

    useStore.getState().editMacro(macro);
    const state = useStore.getState();

    expect(state.originalTriggerText).toBe(':test');
    expect(state.triggerText).toBe(':test');
    expect(state.replaceText).toBe('Test Replace');
    expect(state.currentView).toBe('editor');
  });

  it('should rename variable and update placeholder text', () => {
    useStore.setState({
      replaceText: 'Hello {{user}}, welcome!',
      variables: [
        { id: 'v1', name: 'user', type: 'form', params: { title: 'User Name' } },
      ],
    });

    useStore.getState().renameVariable('v1', 'username');

    const state = useStore.getState();
    expect(state.replaceText).toBe('Hello {{username}}, welcome!');
    expect(state.variables[0].name).toBe('username');
  });

  it('should reconcile unused variables from replaceText', () => {
    useStore.setState({
      replaceText: 'Hello {{user}}!',
      variables: [
        { id: 'v1', name: 'user', type: 'form', params: {} },
        { id: 'v2', name: 'unused', type: 'date', params: {} },
      ],
    });

    useStore.getState().reconcileVariables();

    const state = useStore.getState();
    expect(state.variables).toHaveLength(1);
    expect(state.variables[0].name).toBe('user');
  });

  describe('Blueprint Editor Node Synchronization', () => {
    it('syncQuickToBlueprint should generate flow nodes and edges from text & variables', () => {
      useStore.setState({
        triggerText: ':greet',
        replaceText: 'Hello {{mydate}}!',
        variables: [
          { id: 'v1', name: 'mydate', type: 'date', params: { format: '%Y-%m-%d' } },
        ],
      });

      useStore.getState().syncQuickToBlueprint();

      const { nodes, edges } = useStore.getState();
      expect(nodes.length).toBeGreaterThanOrEqual(3); // Trigger + 'Hello ' + '{{mydate}}' + '!'
      expect(edges.length).toBe(nodes.length - 1);

      const triggerNode = nodes.find(n => n.data.nodeType === 'trigger');
      expect(triggerNode).toBeDefined();
      expect(triggerNode?.data.label).toBe(':greet');

      const dateNode = nodes.find(n => n.data.nodeType === 'D');
      expect(dateNode).toBeDefined();
      expect(dateNode?.data.label).toBe('Date Gen');
    });

    it('syncBlueprintToQuick should compile flow graph back into text and variables', () => {
      useStore.setState({
        nodes: [
          {
            id: 'trigger-start',
            type: 'customNode',
            position: { x: 100, y: 150 },
            data: { label: ':sig', nodeType: 'trigger' },
          },
          {
            id: 'node-text-1',
            type: 'customNode',
            position: { x: 450, y: 150 },
            data: { label: 'Regards, ', nodeType: 'T', text: 'Regards, ' },
          },
          {
            id: 'node-var-2',
            type: 'customNode',
            position: { x: 800, y: 150 },
            data: { label: 'Date Gen', nodeType: 'D', varName: 'today', format: '%Y-%m-%d' },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-start', target: 'node-text-1' },
          { id: 'e2', source: 'node-text-1', target: 'node-var-2' },
        ],
      });

      useStore.getState().syncBlueprintToQuick();

      const state = useStore.getState();
      expect(state.triggerText).toBe(':sig');
      expect(state.replaceText).toBe('Regards, {{today}}');
      expect(state.variables).toHaveLength(1);
      expect(state.variables[0]).toEqual({
        id: 'node-var-2',
        name: 'today',
        type: 'date',
        params: { format: '%Y-%m-%d' },
      });
    });

    it('should perform a bi-directional round-trip sync without data loss', () => {
      useStore.setState({
        triggerText: ':roundtrip',
        replaceText: 'Value: {{opt}}',
        variables: [
          { id: 'v1', name: 'opt', type: 'random', params: { choices: 'A, B' } },
        ],
      });

      // 1. Quick -> Blueprint
      useStore.getState().syncQuickToBlueprint();

      // 2. Blueprint -> Quick
      useStore.getState().syncBlueprintToQuick();

      const state = useStore.getState();
      expect(state.triggerText).toBe(':roundtrip');
      expect(state.replaceText).toBe('Value: {{opt}}');
      expect(state.variables).toHaveLength(1);
      expect(state.variables[0].name).toBe('opt');
      expect(state.variables[0].type).toBe('random');
    });
  });
});
