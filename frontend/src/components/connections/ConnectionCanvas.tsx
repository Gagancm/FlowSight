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
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ToolNode } from './ToolNode';
import { ConnectionEdge } from './ConnectionEdge';
import { Toast } from '../shared/Toast';

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
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' | 'info' } | null>(null);

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    toolNode: ToolNode,
  }), []);

  // Register custom edge types
  const edgeTypes: EdgeTypes = useMemo(() => ({
    connectionEdge: ConnectionEdge,
  }), []);

  // Validate connections before they're created (only for self-loops, duplicates checked in onConnect)
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // React Flow already blocks self-connections, but we keep this for explicitness
      if (connection.source === connection.target) {
        setToast({ message: 'Cannot connect a tool to itself', type: 'warning' });
        return false;
      }
      return true;
    },
    []
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Validation happens inside setEdges to access latest state
      setEdges((currentEdges) => {
        // Check for duplicate
        const isDuplicate = currentEdges.some(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );

        if (isDuplicate) {
          setToast({ message: 'Connection already exists', type: 'warning' });
          return currentEdges; // Return unchanged
        }

        // Add the new connection
        setToast({ message: 'Connection created successfully', type: 'success' });
        return addEdge({
          ...params,
          type: 'connectionEdge',
          animated: true,
          data: {
            status: 'active',
          },
        }, currentEdges);
      });
    },
    [setEdges]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (deleted.length > 0) {
        const toolName = deleted[0].data.name;
        setToast({ message: `${toolName} removed from canvas`, type: 'info' });
      }
    },
    []
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (deleted.length > 0) {
        setToast({ message: 'Connection removed', type: 'info' });
      }
    },
    []
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

      // Validation: Check if this tool type already exists on canvas
      const toolExists = nodes.some(
        (node) => node.data.tool === tool.id
      );

      if (toolExists) {
        setToast({ message: `${tool.name} is already on the canvas`, type: 'warning' });
        return;
      }

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
      setToast({ message: `${tool.name} added to canvas`, type: 'success' });
    },
    [reactFlowInstance, nodes, setNodes]
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
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode="Delete"
        fitView
        proOptions={{ hideAttribution: true }}
        className="react-flow-canvas connections-canvas"
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

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
