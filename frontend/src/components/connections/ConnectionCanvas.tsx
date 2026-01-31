import { useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ConnectionCanvasProps {
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onInit?: (instance: ReactFlowInstance) => void;
}

export function ConnectionCanvas({ onNodesChange, onEdgesChange, onInit }: ConnectionCanvasProps) {
  // Initial empty state - we'll add nodes via drag & drop
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep', // Smooth bezier curves
        animated: true, // Animated flow for n8n effect
      }, eds));
    },
    [setEdges]
  );

  // Handle node drag end
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      onNodesChange?.(nodes);
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      onEdgesChange?.(edges);
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  // Expose React Flow instance to parent
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      onInit?.(instance);
    },
    [onInit]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="react-flow-canvas"
      >
        {/* n8n-style dot grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="rgba(255, 255, 255, 0.15)"
          className="react-flow-background"
        />

        {/* Mini map - hidden for cleaner UI */}
        {/* 
        <MiniMap
          nodeColor={(node) => {
            return 'var(--color-bg-secondary)';
          }}
          className="react-flow-minimap"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
          }}
        />
        */}

        {/* Canvas controls (zoom, fit view, etc.) - hidden as we have custom controls */}
        <Controls 
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="hidden"
        />
      </ReactFlow>
    </div>
  );
}
