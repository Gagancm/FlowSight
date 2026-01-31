import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { StatusIndicator } from '../shared/StatusIndicator';
import { Avatar } from '../shared/Avatar';
import type { Branch } from '../../types/flow';

interface FlowNodeData {
  branch: Branch;
  onHover?: (branch: Branch | null) => void;
}

interface FlowNodeProps {
  data: FlowNodeData;
  selected?: boolean;
  id?: string;
}

function FlowNodeComponent({ data, selected, id }: FlowNodeProps) {
  const { branch, onHover } = data;
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

      <div
        className="flow-node"
        onMouseEnter={() => onHover?.(branch)}
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Connection handle - top */}
        <Handle
          type="target"
          position={Position.Top}
          className="flow-node-handle"
        />

        {/* Node content */}
        <div className="flow-node-content">
          {/* Status and title */}
          <div className="flow-node-header">
            <StatusIndicator status={branch.status} pulse={branch.status === 'critical'} />
            <span className="flow-node-title">{branch.name}</span>
          </div>

          {/* Author */}
          <div className="flow-node-author">
            <Avatar name={branch.author} size="sm" />
            <span className="text-xs text-[var(--color-text-secondary)]">@{branch.author}</span>
          </div>

          {/* Jira ticket */}
          {branch.jiraTicket && (
            <div className="flow-node-meta">
              <span className="text-xs text-[var(--color-text-muted)]">{branch.jiraTicket}</span>
              {branch.jiraTitle && (
                <span className="text-xs text-[var(--color-text-secondary)] ml-1">· {branch.jiraTitle}</span>
              )}
            </div>
          )}

          {/* Wait time */}
          {branch.daysWaiting !== undefined && (
            <div className="flow-node-meta">
              <span className="text-xs text-[var(--color-text-muted)]">⏱️ {branch.daysWaiting}d wait</span>
            </div>
          )}

          {/* Blocking indicator */}
          {branch.blocking && branch.blocking.length > 0 && (
            <div className="flow-node-blocking">
              <span className="text-xs text-[var(--color-critical)]">🔴 Blocking {branch.blocking.length} features</span>
            </div>
          )}
        </div>

        {/* Connection handle - bottom */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="flow-node-handle"
        />
      </div>
    </>
  );
}

export const FlowNode = memo(FlowNodeComponent);
