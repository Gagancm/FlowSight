import { memo } from 'react';
import { EdgeProps } from 'reactflow';

interface GitGraphEdgeData {
  status?: 'active' | 'inactive' | 'error' | 'syncing';
}

function GitGraphEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition: _sourcePosition,
  targetPosition: _targetPosition,
  data,
  selected,
}: EdgeProps<GitGraphEdgeData>) {
  const status = data?.status || 'active';

  // Get edge color based on status
  const getEdgeColor = () => {
    switch (status) {
      case 'active':
        return 'var(--color-accent)';
      case 'error':
        return 'var(--color-critical)';
      case 'syncing':
        return 'var(--color-warning)';
      case 'inactive':
      default:
        return 'var(--color-border)';
    }
  };

  const edgeColor = getEdgeColor();

  // Create simple path: vertical line on left + horizontal line to dot
  const createGitGraphPath = () => {
    // For list view: straight vertical line + horizontal connection to dot
    const verticalX = Math.min(sourceX, targetX); // Use leftmost X for vertical line
    
    if (Math.abs(targetX - sourceX) < 5) {
      // Same column - just vertical line
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    // Path: start at source → horizontal to vertical line → down vertical → horizontal to target
    return `
      M ${sourceX} ${sourceY}
      L ${verticalX} ${sourceY}
      L ${verticalX} ${targetY}
      L ${targetX} ${targetY}
    `.trim();
  };

  const edgePath = createGitGraphPath();

  return (
    <g className="git-graph-edge-group">
      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path git-graph-line"
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
        stroke={edgeColor}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Much larger background circles to mask ALL crossing lines */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={12}
        fill="var(--color-bg-primary)"
        className="git-graph-dot-bg"
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={12}
        fill="var(--color-bg-primary)"
        className="git-graph-dot-bg"
      />

      {/* Visible dots on top */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={6}
        fill={edgeColor}
        stroke="var(--color-bg-primary)"
        strokeWidth={2}
        className="git-graph-dot"
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={6}
        fill={edgeColor}
        stroke="var(--color-bg-primary)"
        strokeWidth={2}
        className="git-graph-dot"
      />
    </g>
  );
}

export const GitGraphEdge = memo(GitGraphEdgeComponent);
