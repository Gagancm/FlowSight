import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowNode } from './FlowNode';
import { ListNode } from './ListNode';
import { ConnectionEdge } from '../connections/ConnectionEdge';
import { GitGraphEdge } from './GitGraphEdge';
import { useFlowData } from '../../hooks/useFlowData';
import { useTheme } from '../../contexts/ThemeContext';
import type { Branch } from '../../types/flow';

const DEMO_VIDEO_SRC = '/demo-flow.mp4'; // Placeholder for flow demo video

// Empty state component for when no project is selected
function EmptyStateDemo() {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="connections-empty-state" aria-hidden>
      <div className="connections-empty-state-card flow-dropdown-panel rounded-2xl p-6 max-w-[520px] w-full shadow-xl">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
          Select a project to view flow
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Choose a project from the dropdown to visualize branch workflows and dependencies
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
              preload="metadata"
              onError={() => setVideoError(true)}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="connections-empty-state-video-placeholder">
              <p className="text-sm text-[var(--color-text-muted)]">
                Add your demo video as <code className="connections-empty-state-code">public/demo-flow.mp4</code>
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">or use the steps below</p>
            </div>
          )}
        </div>

        <ol className="connections-empty-state-steps list-none p-0 m-0">
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">1</span>
            <span>Select a project from the dropdown (top left)</span>
          </li>
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">2</span>
            <span>View branch workflows and dependencies in the selected layout</span>
          </li>
          <li className="flex items-start gap-3 mb-2.5 last:mb-0 text-sm text-[var(--color-text-secondary)]">
            <span className="connections-empty-state-step-num">3</span>
            <span>Hover over branches to see details and AI recommendations</span>
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

interface BranchFlowCanvasProps {
  onInit?: (instance: ReactFlowInstance) => void;
  onHover?: (branch: Branch | null) => void;
  onHoverPosition?: (position: { x: number; y: number } | null) => void;
  onNodeClick?: (branch: Branch, position: { x: number; y: number }) => void;
  viewType?: 'github' | 'pr' | 'timeline' | 'list';
  projectName?: string | null; // Add projectName prop to check if project is selected
  onViewportChange?: () => void; // Callback for viewport changes
}

// Convert branches to React Flow nodes with hierarchical positioning (Github Graph - default)
function branchesToNodesGithub(branches: Branch[]): Node[] {
  const nodes: Node[] = [];
  const levelMap = new Map<string, number>();
  
  // Calculate levels (depth in hierarchy)
  const calculateLevel = (branch: Branch): number => {
    if (levelMap.has(branch.id)) {
      return levelMap.get(branch.id)!;
    }
    if (!branch.parent) {
      levelMap.set(branch.id, 0);
      return 0;
    }
    const parentBranch = branches.find(b => b.id === branch.parent);
    if (!parentBranch) {
      levelMap.set(branch.id, 0);
      return 0;
    }
    const level = calculateLevel(parentBranch) + 1;
    levelMap.set(branch.id, level);
    return level;
  };

  // Calculate levels for all branches
  branches.forEach(branch => calculateLevel(branch));

  // Group branches by level
  const branchesByLevel = new Map<number, Branch[]>();
  branches.forEach(branch => {
    const level = levelMap.get(branch.id) || 0;
    if (!branchesByLevel.has(level)) {
      branchesByLevel.set(level, []);
    }
    branchesByLevel.get(level)!.push(branch);
  });

  // Position nodes - hierarchical vertical layout
  const HORIZONTAL_SPACING = 320;
  const VERTICAL_SPACING = 180;
  const START_X = 400;
  const START_Y = 100;

  branchesByLevel.forEach((levelBranches, level) => {
    const totalWidth = (levelBranches.length - 1) * HORIZONTAL_SPACING;
    const startX = START_X - totalWidth / 2;

    levelBranches.forEach((branch, index) => {
      const x = startX + index * HORIZONTAL_SPACING;
      const y = START_Y + level * VERTICAL_SPACING;

      nodes.push({
        id: branch.id,
        type: 'flowNode',
        position: { x, y },
        data: {
          branch,
        },
      });
    });
  });

  return nodes;
}

// Convert branches to React Flow nodes - PR Graph (horizontal timeline)
function branchesToNodesPR(branches: Branch[]): Node[] {
  const nodes: Node[] = [];
  
  // Filter only PRs and related branches
  const prs = branches.filter(b => b.prId !== undefined);
  const HORIZONTAL_SPACING = 350;
  const START_X = 100;
  const START_Y = 250;

  prs.forEach((branch, index) => {
    nodes.push({
      id: branch.id,
      type: 'flowNode',
      position: { x: START_X + index * HORIZONTAL_SPACING, y: START_Y },
      data: {
        branch,
      },
    });
  });

  return nodes;
}

// Convert branches to React Flow nodes - List View (vertical list like BranchGraph)
function branchesToNodesList(branches: Branch[]): Node[] {
  const nodes: Node[] = [];
  
  // Build ordered list of (branch, depth) for tree display
  const byParent = new Map<string, Branch[]>();
  
  for (const b of branches) {
    const parent = b.parent ?? '__root__';
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(b);
  }
  
  const ordered: { branch: Branch; depth: number }[] = [];
  function walk(parentId: string, depth: number) {
    const children = byParent.get(parentId);
    if (!children) return;
    for (const b of children) {
      ordered.push({ branch: b, depth });
      walk(b.id, depth + 1);
    }
  }
  walk('__root__', 0);

  // Position nodes vertically in a compact list (matching BranchGraph layout)
  const START_X = 50; // Start from left edge
  const START_Y = 50;
  const VERTICAL_SPACING = 60; // Reduced from 70 for tighter spacing
  const INDENT_PER_LEVEL = 28; // Match BranchGraphBox indentation

  let currentY = START_Y;

  ordered.forEach(({ branch, depth }, index) => {
    // Add gap after 'main' branch (like in BranchGraph)
    if (index > 0 && ordered[index - 1].branch.id === 'main') {
      currentY += 50; // Reduced gap spacing
    }

    nodes.push({
      id: branch.id,
      type: 'listNode', // Use listNode type for list view
      position: { 
        x: START_X + (depth * INDENT_PER_LEVEL), 
        y: currentY
      },
      data: {
        branch,
      },
    });

    currentY += VERTICAL_SPACING;
  });

  return nodes;
}

// Convert branches to React Flow nodes - Timeline (horizontal by creation time)
function branchesToNodesTimeline(branches: Branch[]): Node[] {
  const nodes: Node[] = [];
  
  // Sort by creation time (using daysWaiting as proxy - older = higher)
  const sortedBranches = [...branches].sort((a, b) => {
    const aWait = a.daysWaiting || 0;
    const bWait = b.daysWaiting || 0;
    return bWait - aWait; // Descending - older first
  });

  const HORIZONTAL_SPACING = 320;
  const START_X = 100;
  const VERTICAL_LANES = [100, 280, 460]; // Multiple horizontal lanes

  sortedBranches.forEach((branch, index) => {
    const laneIndex = index % VERTICAL_LANES.length;
    nodes.push({
      id: branch.id,
      type: 'flowNode',
      position: { 
        x: START_X + Math.floor(index / VERTICAL_LANES.length) * HORIZONTAL_SPACING, 
        y: VERTICAL_LANES[laneIndex]
      },
      data: {
        branch,
      },
    });
  });

  return nodes;
}

// Convert branch relationships to React Flow edges
function branchesToEdges(branches: Branch[], viewType?: string): Edge[] {
  const edges: Edge[] = [];
  const edgeType = viewType === 'list' ? 'gitGraphEdge' : 'connectionEdge';

  branches.forEach(branch => {
    // Parent relationship (dependency)
    if (branch.parent) {
      edges.push({
        id: `${branch.parent}-${branch.id}`,
        source: branch.parent,
        target: branch.id,
        type: edgeType,
        animated: branch.status === 'critical' && viewType !== 'list',
        data: {
          status: branch.status === 'critical' ? 'error' : 
                  branch.status === 'warning' ? 'syncing' : 'active',
        },
      });
    }

    // Blocking relationships (skip in list view for cleaner look)
    if (viewType !== 'list' && branch.blocking && branch.blocking.length > 0) {
      branch.blocking.forEach(blockedId => {
        const blockedBranch = branches.find(b => b.name === blockedId || b.id === blockedId);
        if (blockedBranch) {
          edges.push({
            id: `block-${branch.id}-${blockedBranch.id}`,
            source: branch.id,
            target: blockedBranch.id,
            type: edgeType,
            animated: true,
            style: { strokeDasharray: '5 5' },
            data: {
              status: 'error',
            },
          });
        }
      });
    }
  });

  return edges;
}

export function BranchFlowCanvas({ onInit, onHover, onHoverPosition, onNodeClick, viewType = 'github', projectName, onViewportChange }: BranchFlowCanvasProps) {
  const { branches } = useFlowData();
  const { theme } = useTheme();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Show empty nodes/edges if no project is selected OR no view is selected
  const shouldShowEmpty = !projectName || viewType === 'none';

  // Convert branches to nodes and edges based on view type
  const initialNodes = useMemo(() => {
    if (shouldShowEmpty) return []; // Return empty array if no project or no view selected
    switch (viewType) {
      case 'pr':
        return branchesToNodesPR(branches);
      case 'timeline':
        return branchesToNodesTimeline(branches);
      case 'list':
        return branchesToNodesList(branches);
      case 'github':
      default:
        return branchesToNodesGithub(branches);
    }
  }, [branches, viewType, shouldShowEmpty]);
  
  const initialEdges = useMemo(() => shouldShowEmpty ? [] : branchesToEdges(branches, viewType), [branches, viewType, shouldShowEmpty]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when viewType or projectName changes
  useEffect(() => {
    if (shouldShowEmpty) {
      // Clear nodes and edges if no project selected
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = (() => {
      switch (viewType) {
        case 'pr':
          return branchesToNodesPR(branches);
        case 'timeline':
          return branchesToNodesTimeline(branches);
        case 'list':
          return branchesToNodesList(branches);
        case 'github':
        default:
          return branchesToNodesGithub(branches);
      }
    })();
    
    setNodes(newNodes);
    setEdges(branchesToEdges(branches, viewType));
    
    // Fit view after layout change with appropriate padding based on view type
    setTimeout(() => {
      if (reactFlowInstance) {
        const padding = viewType === 'list' ? 0.5 : 0.2; // More padding for list view
        reactFlowInstance.fitView({ padding, duration: 300 });
      }
    }, 100);
  }, [viewType, branches, reactFlowInstance, setNodes, setEdges, shouldShowEmpty]);

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    flowNode: FlowNode,
    listNode: ListNode,
  }), []);

  // Register custom edge types
  const edgeTypes: EdgeTypes = useMemo(() => ({
    connectionEdge: ConnectionEdge,
    gitGraphEdge: GitGraphEdge,
  }), []);

  // Expose React Flow instance to parent and set initial zoom
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);
      onInit?.(instance);
      // Fit view with even more padding to zoom out further
      setTimeout(() => {
        instance.fitView({ padding: 0.6, duration: 0 });
      }, 100);
    },
    [onInit]
  );

  // Handle node mouse enter
  const onNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const branch = node.data.branch as Branch;
      onHover?.(branch);
      
      if (reactFlowInstance && onHoverPosition) {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        const screenX = node.position.x * zoom + x;
        const screenY = node.position.y * zoom + y;
        onHoverPosition({ x: screenX, y: screenY });
      }
    },
    [onHover, onHoverPosition, reactFlowInstance]
  );

  // Handle node mouse leave
  const onNodeMouseLeave = useCallback(
    () => {
      onHover?.(null);
      onHoverPosition?.(null);
    },
    [onHover, onHoverPosition]
  );

  // Handle node click to pin the hover panel
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const branch = node.data.branch as Branch;
      
      if (reactFlowInstance && onNodeClick) {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        const screenX = node.position.x * zoom + x;
        const screenY = node.position.y * zoom + y;
        onNodeClick(branch, { x: screenX, y: screenY });
      }
    },
    [onNodeClick, reactFlowInstance]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={handleInit}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={handleNodeClick}
        onMove={onViewportChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={viewType !== 'list'}
        nodesConnectable={viewType !== 'list'}
        elementsSelectable={viewType !== 'list'}
        deleteKeyCode="Delete"
        fitView
        fitViewOptions={{ padding: 0.6, minZoom: 0.3, maxZoom: 2 }}
        proOptions={{ hideAttribution: true }}
        className="react-flow-canvas flow-canvas"
      >
        {/* Theme-aware dot grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
          className="react-flow-background"
        />

        {/* Canvas controls - hidden as we have custom controls */}
        <Controls 
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="hidden"
        />
      </ReactFlow>

      {/* Empty state when no project is selected */}
      {shouldShowEmpty && <EmptyStateDemo />}
    </div>
  );
}
