import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

interface ToolNodeData {
  tool: string;
  name: string;
  icon: string;
  status?: 'active' | 'inactive' | 'error' | 'syncing';
}

interface ToolNodeProps {
  data: ToolNodeData;
  selected?: boolean;
  id?: string;
}

// SVG Icons for tools
const getToolIcon = (icon: string) => {
  const iconMap: Record<string, JSX.Element> = {
    github: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
    jira: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"/>
      </svg>
    ),
    slack: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    ),
    confluence: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.87 18.257c-.248.382-.463.734-.656 1.063a1.48 1.48 0 0 0 .35 2.079l3.484 2.456a1.53 1.53 0 0 0 2.13-.372c.185-.304.379-.621.59-.95 1.69-2.633 3.234-3.479 6.035-2.407.53.203 1.135.434 1.815.69a1.495 1.495 0 0 0 1.916-.803l1.233-3.886a1.477 1.477 0 0 0-.826-1.877c-.669-.255-1.315-.503-1.932-.736-5.32-2.03-8.476-.493-11.139 4.743zM23.13 5.743c.248-.382.463-.734.656-1.063a1.48 1.48 0 0 0-.35-2.079L20.952.145a1.53 1.53 0 0 0-2.13.372c-.185.304-.379.621-.59.95-1.69 2.633-3.234 3.479-6.035 2.407a94.933 94.933 0 0 0-1.815-.69 1.495 1.495 0 0 0-1.916.803L7.233 7.873a1.477 1.477 0 0 0 .826 1.877c.669.255 1.315.503 1.932.736 5.32 2.03 8.476.493 11.139-4.743z"/>
      </svg>
    ),
    servicenow: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S6.698 2.4 12 2.4s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/>
        <path d="M13.2 6h-2.4v6.3l5.1 3.1 1.2-1.9-3.9-2.3z"/>
      </svg>
    ),
  };
  return iconMap[icon] || (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
};

// Status indicator colors
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'var(--color-success)';
    case 'error':
      return 'var(--color-critical)';
    case 'syncing':
      return 'var(--color-warning)';
    case 'inactive':
    default:
      return 'var(--color-text-muted)';
  }
};

function ToolNodeComponent({ data, selected, id }: ToolNodeProps) {
  const { name, icon, status = 'inactive' } = data;
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteElements({ nodes: [{ id }] });
    }
  };

  return (
    <>
      {/* Delete button - positioned outside the node */}
      {selected && id && (
        <button
          className="absolute w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-critical)] text-white hover:scale-110 transition-all shadow-md"
          style={{ top: '-1.5rem', right: '-1.5rem', zIndex: 1000 }}
          onClick={handleDelete}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className="tool-node">

      {/* Connection handle - left side */}
      <Handle
        type="target"
        position={Position.Left}
        className="tool-node-handle"
      />

      {/* Node content */}
      <div className="tool-node-content">
        {/* Status indicator */}
        <div 
          className="tool-node-status"
          style={{ backgroundColor: getStatusColor(status) }}
        />

        {/* Tool icon */}
        <div className="tool-node-icon">
          {getToolIcon(icon)}
        </div>

        {/* Tool name */}
        <div className="tool-node-name">
          {name}
        </div>
      </div>

      {/* Connection handle - right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="tool-node-handle"
      />
    </div>
    </>
  );
}

// Memoize to prevent unnecessary re-renders
export const ToolNode = memo(ToolNodeComponent);
