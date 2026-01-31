import { useCallback, useMemo, useRef, useState } from 'react';
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
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ToolNode } from './ToolNode';

interface ConnectionCanvasProps {
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onInit?: (instance: ReactFlowInstance) => void;
}

export function ConnectionCanvas({ onNodesChange, onEdgesChange, onInit }: ConnectionCanvasProps) {
  // Initial state with one test node
  const initialNodes: Node[] = [
    {
      id: 'test-github',
      type: 'toolNode',
      position: { x: 250, y: 200 },
      data: {
        tool: 'github',
        name: 'GitHub',
        icon: 'github',
        status: 'active',
      },
    },
  ];

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    toolNode: ToolNode,
  }), []);

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
      setReactFlowInstance(instance);
      onInit?.(instance);
    },
    [onInit]
  );

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      // Get the tool data from drag event
      const toolData = event.dataTransfer.getData('application/json');
      if (!toolData) return;

      const tool = JSON.parse(toolData);

      // Get the position where the tool was dropped
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create a new node
      const newNode: Node = {
        id: `${tool.id}-${Date.now()}`, // Unique ID
        type: 'toolNode',
        position,
        data: {
          tool: tool.id,
          name: tool.name,
          icon: tool.icon,
          status: 'inactive',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Allow drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div 
      className="w-full h-full" 
      ref={reactFlowWrapper}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        nodeTypes={nodeTypes}
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
