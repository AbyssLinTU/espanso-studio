import { useEffect, useCallback, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { IconSidebar } from './components/layout/IconSidebar';
import { HomeView } from './components/views/HomeView';
import { QuickEditor } from './components/editor/QuickEditor';
import { BlueprintEditor } from './components/editor/BlueprintEditor';
import { LivePreview } from './components/editor/LivePreview';
import { HelpView } from './components/views/HelpView';
import { useStore } from './store/useStore';
import { useResize } from './hooks/useResize';
import { useWindowSize } from './hooks/useWindowSize';
import { EspansoService } from './services/EspansoService';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from './utils/animations';
import { InstallModal } from './components/layout/InstallModal';

/**
 * Persists the active file matches and graph sidecar state to disk, then restarts Espanso daemon.
 */
async function persistActiveFile(showToast = false): Promise<void> {
  const { activeFile, macros, nodes, edges } = useStore.getState();
  if (!activeFile) {
    toast.error('No file selected – cannot save');
    return;
  }
  try {
    const yamlContent = EspansoService.stringifyYaml(macros);
    await EspansoService.saveFile(activeFile, yamlContent);

    const sidecar = { nodes, edges };
    await EspansoService.saveFile(
      `.${activeFile}.studio.json`,
      JSON.stringify(sidecar, null, 2)
    );

    await EspansoService.restart();
    if (showToast) {
      toast.success('Saved & restarted!');
    }
  } catch (err) {
    toast.error(`Save failed: ${err}`);
    throw err;
  }
}

function App() {
  const {
    currentView,
    editorMode,
    previewCollapsed,
    togglePreview,
    setFileList,
    setMacros,
    setActiveFile,
  } = useStore();
  const [ready, setReady] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Custom panel resizer (initial 360px, min 280, max 600)
  const { width: previewWidth, startResize, isResizing } = useResize(360, 280, 600);
  const { width: windowWidth } = useWindowSize();

  // Auto-collapse preview on smaller screens
  useEffect(() => {
    if (windowWidth < 1200 && !previewCollapsed) {
      useStore.getState().setPreviewCollapsed(true);
    }
  }, [windowWidth, previewCollapsed]);

  const fetchFiles = useCallback(async () => {
    const isInstalled = await EspansoService.checkInstalled();
    if (!isInstalled) {
      setShowInstallModal(true);
      setReady(true);
      return;
    }

    const files = await EspansoService.listFiles();
    if (files && files.length > 0) {
      setFileList(files);
      setActiveFile(files[0]);
      const content = await EspansoService.readFile(files[0]);
      if (content) {
        try {
          const matches = EspansoService.parseYaml(content);
          setMacros(matches);
        } catch {
          // skip parse error
        }
      }
    }
    setReady(true);
  }, [setFileList, setMacros, setActiveFile]);

  const saveFile = useCallback(() => {
    return persistActiveFile(true);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Listen for the 'espanso-save' event dispatched by the store after saveMacro() or deleteMacro()
  useEffect(() => {
    const handleEspansoSave = () => {
      persistActiveFile(false);
    };
    window.addEventListener('espanso-save', handleEspansoSave);
    return () => window.removeEventListener('espanso-save', handleEspansoSave);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const state = useStore.getState();

      // Global Save (Cmd+S / Ctrl+S)
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (state.currentView === 'editor') {
          state.saveMacro();
        } else {
          saveFile();
        }
        return;
      }

      // Ignore remaining hotkeys while typing in input/textarea
      if (isInput) return;

      // Mode switch (Cmd+B / Ctrl+B)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (state.currentView === 'editor') {
          const nextMode = state.editorMode === 'quick' ? 'blueprint' : 'quick';
          state.setEditorMode(nextMode);
          toast(`Switched to ${nextMode === 'quick' ? 'Quick' : 'Blueprint'} Mode`, { duration: 1500 });
        }
        return;
      }

      // Undo / Redo (Cmd+Z / Cmd+Shift+Z / Cmd+Y)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          state.redo();
          toast('Redo', { duration: 800 });
        } else {
          state.undo();
          toast('Undo', { duration: 800 });
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        state.redo();
        toast('Redo', { duration: 800 });
        return;
      }

      // Return Home (Cmd+H)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'h' && !e.shiftKey) {
        e.preventDefault();
        state.setCurrentView('home');
        toast('Returned Home', { duration: 1000 });
        return;
      }

      // New Macro (Cmd+N)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        state.resetEditor();
        toast('New Macro', { duration: 1000 });
        return;
      }

      // Focus Search (Cmd+F)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        if (state.currentView === 'home') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('focus-search'));
        }
        return;
      }

      // Escape to exit editor
      if (e.key === 'Escape') {
        if (state.currentView === 'editor') {
          state.setCurrentView('home');
          toast('Closed Editor', { duration: 1000 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-[#6366F1] border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
          <span className="text-[15px] text-[#A1A1AA] font-semibold tracking-wide">Waking up Tauri...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView === 'editor' ? `editor-${editorMode}` : currentView}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full w-full"
        >
          {currentView === 'home' && <HomeView />}
          {currentView === 'help' && <HelpView />}
          {currentView === 'editor' && editorMode === 'quick' && <QuickEditor />}
          {currentView === 'editor' && editorMode === 'blueprint' && <BlueprintEditor />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className={`flex h-screen bg-[#09090B] text-[#F4F4F5] font-sans overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1C1C1F',
            border: '1px solid #2D2D30',
            color: '#F4F4F5',
            fontSize: '14px',
            fontWeight: 600,
          },
        }}
      />

      <InstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
      />

      {/* Col 1: Fixed Icon Sidebar */}
      <IconSidebar />

      {/* Col 2: Main Content Panel */}
      <div className="flex-1 overflow-hidden bg-[#121214] flex flex-col min-w-0 w-full">
        {renderContent()}
      </div>

      {/* Col 3: Draggable Resizer & LivePreview (Only in Editor) */}
      {currentView === 'editor' && (
        <div 
          className={`flex h-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            previewCollapsed ? 'w-[20px] bg-[#0F0F11] border-l border-[#2D2D30] cursor-pointer hover:bg-[#1C1C1F] group' : ''
          }`}
          style={!previewCollapsed ? { width: `${previewWidth}px` } : {}}
          onClick={previewCollapsed ? togglePreview : undefined}
          title={previewCollapsed ? "Show Live Preview" : undefined}
        >
          {previewCollapsed ? (
            <div className="w-full h-full flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-[#71717A] group-hover:text-[#F4F4F5] group-hover:-translate-x-0.5 transition-all" strokeWidth={2.5} />
            </div>
          ) : (
            <>
              <div
                onMouseDown={startResize}
                className="w-1.5 bg-[#1C1C1F] hover:bg-[#6366F1]/50 active:bg-[#6366F1] transition-colors cursor-col-resize border-x border-[#2D2D30] z-20 shrink-0"
              />
              <div className="flex-1 overflow-hidden min-w-0">
                <LivePreview />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
