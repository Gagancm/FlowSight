import { memo } from 'react';
import { EdgeProps, getBezierPath, useReactFlow } from 'reactflow';

interface ConnectionEdgeData {
  status?: 'active' | 'connected' | 'inactive' | 'error' | 'syncing';
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
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status || 'inactive';

  // Get edge color based on status: active=blue (data flow), connected=yellow/orange (idle), inactive=grey
  const getEdgeColor = () => {
    switch (status) {
      case 'active':
        return 'var(--color-accent)';
      case 'connected':
        return 'var(--color-warning)';
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

  const handleDoubleClick = () => {
    deleteElements({ edges: [{ id }] });
  };

  return (
    <g onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
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

      {/* Invisible wider path for easier double-click target */}
      <path
        d={edgePath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        strokeLinecap="round"
      />

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
        pointerEvents="none"
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
        <g transform={`translate(${labelX}, ${labelY})`} pointerEvents="none">
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
    </g>
  );
}

export const ConnectionEdge = memo(ConnectionEdgeComponent);
