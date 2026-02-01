import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
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
import { useTheme } from '../../contexts/ThemeContext';

export interface ConnectionProject {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface DropRequestPayload {
  tool: { id: string; name: string; icon: string };
  position: { x: number; y: number };
}

interface ConnectionCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  noProjectMode?: boolean;
  onDropRequestProject?: (payload: DropRequestPayload) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  /** Called whenever nodes or edges change (e.g. for persisting to project). Receives latest nodes and edges. */
  onCanvasChange?: (nodes: Node[], edges: Edge[]) => void;
  onInit?: (instance: ReactFlowInstance) => void;
}

const NODE_PADDING = 24;

function getNodeDimensions(node: Node): { width: number; height: number } {
  const measured = (node as Node & { measured?: { width?: number; height?: number } }).measured;
  const width = (measured?.width ?? node.width) as number | undefined;
  const height = (measured?.height ?? node.height) as number | undefined;
  if (width != null && height != null) return { width, height };
  const name = (node.data?.name as string) || '';
  const isRectangle = name.length > 6;
  return {
    width: isRectangle ? 170 : 120,
    height: 90,
  };
}

function rectsOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function findNonOverlappingPosition(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  otherNodes: Node[],
  excludeNodeId?: string
): { x: number; y: number } {
  const { x, y } = position;
  const { width, height } = dimensions;
  const step = NODE_PADDING + Math.min(width, height) / 2;

  const overlapsWith = (nx: number, ny: number) =>
    otherNodes.some((n) => {
      if (n.id === excludeNodeId) return false;
      const dim = getNodeDimensions(n);
      return rectsOverlap(nx, ny, width, height, n.position.x, n.position.y, dim.width, dim.height);
    });

  if (!overlapsWith(x, y)) return { x, y };

  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
  ];

  for (let radius = 1; radius <= 8; radius++) {
    for (const [dx, dy] of directions) {
      const nx = x + dx * step * radius;
      const ny = y + dy * step * radius;
      if (!overlapsWith(nx, ny)) return { x: nx, y: ny };
    }
  }

  return { x: x + step * 2, y: y + step * 2 };
}

/** Optional: set to your demo video URL (e.g. /demo-add-connections.mp4 in public folder) */
const DEMO_VIDEO_SRC = '/demo-add-connections.mp4';

function EmptyStateDemo() {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="connections-empty-state" aria-hidden>
      <div className="connections-empty-state-card flow-dropdown-panel rounded-2xl p-6 max-w-[520px] w-full shadow-xl">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
          Add your first connection
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Watch how to open the Add sidebar and drag tools onto the canvas
        </p>

        <div className="connections-empty-state-video-wrap rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
          {!videoError ? (
            <video
              className="connections-empty-state-video"
              src={DEMO_VIDEO_SRC}
              controls
              loop
              muted
              playsInline
              autoPlay
              preload="metadata"
              onError={() => setVideoError(true)}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="connections-empty-state-video-placeholder">
              <p className="text-sm text-[var(--color-text-muted)]">
                Add your demo video as <code className="connections-empty-state-code">public/demo-add-connections.mp4</code>
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">or use the steps below</p>
            </div>
          )}
        </div>

        <ol className="connections-empty-state-steps list-none p-0 m-0">
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">1</span>
            <span>Click the <strong className="text-[var(--color-text-primary)] font-semibold">+</strong> button (top right) to open the Add sidebar</span>
          </li>
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">2</span>
            <span>Drag a tool from the sidebar and drop it onto the canvas</span>
          </li>
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">3</span>
            <span>Connect tools by dragging from one node’s handle to another</span>
          </li>
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">4</span>
            <span>Or select a project from dropdown to get started</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export function ConnectionCanvas({
  initialNodes = [],
  initialEdges = [],
  noProjectMode = false,
  onDropRequestProject,
  onNodesChange,
  onEdgesChange,
  onCanvasChange,
  onInit,
}: ConnectionCanvasProps) {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
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

  // Compute optimal handle pair based on node positions (so lines don't go behind nodes)
  const getOptimalHandles = useCallback(
    (sourceId: string, targetId: string): { sourceHandle: string; targetHandle: string } => {
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);
      if (!sourceNode || !targetNode) {
        return { sourceHandle: 'source-right', targetHandle: 'target-left' };
      }

      const nodeWidth = 80;
      const nodeHeight = 50;
      const sourceCenterX = sourceNode.position.x + nodeWidth;
      const sourceCenterY = sourceNode.position.y + nodeHeight;
      const targetCenterX = targetNode.position.x + nodeWidth;
      const targetCenterY = targetNode.position.y + nodeHeight;

      const dx = targetCenterX - sourceCenterX;
      const dy = targetCenterY - sourceCenterY;

      // Prefer the axis with greater distance for cleaner routing
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) return { sourceHandle: 'source-right', targetHandle: 'target-left' };
        return { sourceHandle: 'source-left', targetHandle: 'target-right' };
      }
      if (dy > 0) return { sourceHandle: 'source-bottom', targetHandle: 'target-top' };
      return { sourceHandle: 'source-top', targetHandle: 'target-bottom' };
    },
    [nodes]
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const source = params.source ?? null;
      const target = params.target ?? null;
      if (!source || !target) return;

      setEdges((currentEdges) => {
        // Block duplicate same-direction connections (bidirectional is allowed: A→B and B→A)
        const isDuplicate = currentEdges.some(
          (edge) => edge.source === source && edge.target === target
        );

        if (isDuplicate) {
          setToast({ message: 'Connection already exists', type: 'warning' });
          return currentEdges;
        }

        const { sourceHandle, targetHandle } = getOptimalHandles(source, target);

        const newEdge = {
          ...params,
          sourceHandle,
          targetHandle,
          type: 'connectionEdge',
          animated: false,
          data: { status: 'connected' as const },
        };
        setToast({ message: 'Connection created successfully', type: 'success' });
        return addEdge(newEdge, currentEdges);
      });
    },
    [setEdges, getOptimalHandles]
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

  // Simulate data transfer: connected edges transition to active (green) after delay
  useEffect(() => {
    const connectedIds = edges
      .filter((e) => e.data?.status === 'connected')
      .map((e) => e.id);
    if (connectedIds.length === 0) return;
    const timer = setTimeout(() => {
      setEdges((eds) =>
        eds.map((e) =>
          connectedIds.includes(e.id)
            ? { ...e, data: { ...e.data, status: 'active' }, animated: true }
            : e
        )
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [edges, setEdges]);

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      onNodesChange?.(nodes);
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  );

  // When a dragged node is dropped, ensure it doesn't overlap others
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === draggedNode.id) ?? draggedNode;
        const others = nds.filter((n) => n.id !== node.id);
        const dimensions = getNodeDimensions(node);
        const safePosition = findNonOverlappingPosition(
          node.position,
          dimensions,
          others,
          node.id
        );

        if (
          Math.abs(safePosition.x - node.position.x) > 1 ||
          Math.abs(safePosition.y - node.position.y) > 1
        ) {
          return nds.map((n) =>
            n.id === node.id ? { ...n, position: safePosition } : n
          );
        }
        return nds;
      });
    },
    [setNodes]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      onEdgesChange?.(edges);
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  // Persist latest nodes/edges to parent whenever they change (so project is saved before tab switch)
  useEffect(() => {
    onCanvasChange?.(nodes, edges);
  }, [nodes, edges, onCanvasChange]);

  // Expose React Flow instance to parent; fit view once on init when we have nodes (user can use Fit button later)
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);
      onInit?.(instance);
      if (initialNodes.length > 0) {
        setTimeout(() => instance.fitView({ padding: 0.2, duration: 0 }), 100);
      }
    },
    [onInit, initialNodes.length]
  );

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const toolData = event.dataTransfer.getData('application/json');
      if (!toolData) return;

      const tool = JSON.parse(toolData);

      const dropPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // When no project, request parent to create "Untitled" and add node
      if (noProjectMode && onDropRequestProject) {
        onDropRequestProject({ tool, position: dropPosition });
        return;
      }

      const toolExists = nodes.some((node) => node.data.tool === tool.id);
      if (toolExists) {
        setToast({ message: `${tool.name} is already on the canvas`, type: 'warning' });
        return;
      }

      const dimensions = getNodeDimensions({ data: { name: tool.name } } as Node);
      const position = findNonOverlappingPosition(dropPosition, dimensions, nodes);

      const newNode: Node = {
        id: `${tool.id}-${Date.now()}`,
        type: 'toolNode',
        position,
        data: { tool: tool.id, name: tool.name, icon: tool.icon, status: 'inactive' },
      };

      setNodes((nds) => nds.concat(newNode));
      setToast({ message: `${tool.name} added to canvas`, type: 'success' });
    },
    [reactFlowInstance, nodes, setNodes, noProjectMode, onDropRequestProject]
  );

  // Allow drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div
      id="connections-flow-export"
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
        onNodeDragStop={onNodeDragStop}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode="Delete"
        fitView={false}
        proOptions={{ hideAttribution: true }}
        className="react-flow-canvas connections-canvas"
      >
        {/* Theme-aware dot grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(139, 141, 147, 0.25)'}
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

      {/* Empty state: video demo when canvas has no nodes */}
      {nodes.length === 0 && <EmptyStateDemo />}

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
