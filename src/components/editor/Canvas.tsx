import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../store/useStore';
import { CustomNode } from './CustomNode';
import { useWindowSize } from '../../hooks/useWindowSize';

const nodeTypes = {
  customNode: CustomNode,
};

export const Canvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { width, height } = useWindowSize();

  useEffect(() => {
    const to = setTimeout(() => {
      fitView({ duration: 400 });
    }, 50);
    return () => clearTimeout(to);
  }, [width, height, fitView]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={() => {
           // Allow deleting nodes via Keyboard when pane is clicked
           (reactFlowWrapper.current?.querySelector('.react-flow__renderer') as HTMLElement)?.focus();
        }}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3F3F46" />
        <Controls 
          className="bg-[#121214] border-[#2D2D30] fill-[#A1A1AA]" 
          position="bottom-left"
          showInteractive={false} 
        />
        <MiniMap 
          nodeColor="#1C1C1F" 
          maskColor="#09090B90" 
          style={{ backgroundColor: '#121214' }} 
        />
      </ReactFlow>
    </div>
  );
};
