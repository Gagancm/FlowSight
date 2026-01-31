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
  sourcePosition,
  targetPosition,
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

  // Create VS Code Git Graph style path with rounded corners
  // For list view: lines run vertically along the left side with rounded corners
  const createGitGraphPath = () => {
    const radius = 8; // Corner radius

    // Both source and target are on the left side of nodes
    // Draw a vertical line with rounded corners if there's horizontal offset
    const horizontalOffset = targetX - sourceX;
    const verticalDistance = targetY - sourceY;

    if (Math.abs(horizontalOffset) < 5) {
      // Straight vertical line (same column)
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    // For indented children: vertical down, then curve right, then vertical down
    const midY = sourceY + (verticalDistance / 2);
    
    if (horizontalOffset > 0) {
      // Child is indented to the right
      return `
        M ${sourceX} ${sourceY}
        L ${sourceX} ${midY - radius}
        Q ${sourceX} ${midY} ${sourceX + radius} ${midY}
        L ${targetX - radius} ${midY}
        Q ${targetX} ${midY} ${targetX} ${midY + radius}
        L ${targetX} ${targetY}
      `.trim();
    } else {
      // Child is to the left (shouldn't happen in list view but handle it)
      return `
        M ${sourceX} ${sourceY}
        L ${sourceX} ${midY - radius}
        Q ${sourceX} ${midY} ${sourceX - radius} ${midY}
        L ${targetX + radius} ${midY}
        Q ${targetX} ${midY} ${targetX} ${midY + radius}
        L ${targetX} ${targetY}
      `.trim();
    }
  };

  const edgePath = createGitGraphPath();

  return (
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
  );
}

export const GitGraphEdge = memo(GitGraphEdgeComponent);
