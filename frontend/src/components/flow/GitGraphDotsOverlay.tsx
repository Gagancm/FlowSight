import { memo } from 'react';
import { useStore, Node, Edge } from 'reactflow';

interface GitGraphDotsOverlayProps {
  nodes: Node[];
  edges: Edge[];
}

// Get status color helper
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'error':
      return 'var(--color-critical)';
    case 'syncing':
      return 'var(--color-warning)';
    case 'active':
      return 'var(--color-success)';
    case 'inactive':
    default:
      return 'var(--color-border)';
  }
};

function GitGraphDotsOverlayComponent({ nodes, edges }: GitGraphDotsOverlayProps) {
  const transform = useStore((s) => s.transform);
  const [x, y, zoom] = transform;

  // Collect all unique connection points from edges
  const connectionPoints = new Map<string, string>(); // key: "x,y", value: color

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const color = getStatusColor(edge.data?.status);
      
      // Get handle positions (left side, center vertically)
      const sourceX = sourceNode.position.x - 8;
      const sourceY = sourceNode.position.y + 24; // Approximate center of card
      const targetX = targetNode.position.x - 8;
      const targetY = targetNode.position.y + 24;
      
      connectionPoints.set(`${sourceX},${sourceY}`, color);
      connectionPoints.set(`${targetX},${targetY}`, color);
    }
  });

  return (
    <svg
      className="react-flow__edges"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100, // Above edges but below hover panel
      }}
    >
      <g transform={`translate(${x},${y}) scale(${zoom})`}>
        {Array.from(connectionPoints.entries()).map(([key, color]) => {
          const [px, py] = key.split(',').map(Number);
          return (
            <g key={key}>
              {/* Background circle to mask lines */}
              <circle
                cx={px}
                cy={py}
                r={8}
                fill="var(--color-bg-primary)"
              />
              {/* Visible dot */}
              <circle
                cx={px}
                cy={py}
                r={6}
                fill={color}
                stroke="var(--color-bg-primary)"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const GitGraphDotsOverlay = memo(GitGraphDotsOverlayComponent);
