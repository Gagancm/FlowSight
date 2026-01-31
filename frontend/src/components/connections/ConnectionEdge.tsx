import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeMarker, MarkerType } from 'reactflow';

interface ConnectionEdgeData {
  status?: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync?: string;
}

function ConnectionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<ConnectionEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status || 'inactive';

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
  const isAnimated = status === 'active' || status === 'syncing';

  // Create marker (arrow) for the edge
  const markerEnd: EdgeMarker = {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: edgeColor,
  };

  return (
    <>
      {/* Glow effect for active/syncing connections */}
      {isAnimated && (
        <path
          d={edgePath}
          strokeWidth={6}
          stroke={edgeColor}
          fill="none"
          opacity={0.2}
          strokeLinecap="round"
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
        stroke={edgeColor}
        fill="none"
        strokeLinecap="round"
        markerEnd={`url(#${id}-arrow)`}
      />

      {/* Define arrow marker */}
      <defs>
        <marker
          id={`${id}-arrow`}
          markerWidth={12}
          markerHeight={12}
          refX={6}
          refY={6}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 3 L 6 6 L 0 9 L 1.5 6 Z"
            fill={edgeColor}
          />
        </marker>
      </defs>

      {/* Connection dot at start */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={4}
        fill={edgeColor}
        stroke="var(--color-bg-primary)"
        strokeWidth={2}
      />

      {/* Optional: Status label in the middle */}
      {selected && status === 'syncing' && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-25}
            y={-10}
            width={50}
            height={20}
            fill="var(--color-bg-secondary)"
            stroke="var(--color-warning)"
            strokeWidth={1}
            rx={4}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontSize={10}
            fill="var(--color-warning)"
            fontWeight="500"
          >
            Syncing...
          </text>
        </g>
      )}
    </>
  );
}

export const ConnectionEdge = memo(ConnectionEdgeComponent);
