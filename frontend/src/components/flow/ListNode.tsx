import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { StatusIndicator } from '../shared/StatusIndicator';
import type { Branch } from '../../types/flow';
import { cn } from '../../utils/helpers';

const PullArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
    <path d="M12 5v14" />
    <path d="M19 12l-7 7-7-7" />
  </svg>
);

const PushArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

interface ListNodeData {
  branch: Branch;
  onHover?: (branch: Branch | null) => void;
}

interface ListNodeProps {
  data: ListNodeData;
  selected?: boolean;
}

function ListNodeComponent({ data }: ListNodeProps) {
  const { branch } = data;

  return (
    <>
      {/* Handles positioned on the left side */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          opacity: 0,
          left: '-8px', // Position at left edge
          top: '50%',
        }}
      />

      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flow-branch-card flex items-center gap-3',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]'
        )}
        style={{ minWidth: '600px' }} // Ensure full width
      >
        <StatusIndicator status={branch.status} pulse={branch.status === 'critical'} />
        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
          {branch.name}
        </span>
        {branch.jiraTicket && (
          <span className="text-xs text-[var(--color-text-muted)] shrink-0">
            {branch.jiraTicket}
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center justify-end gap-2 shrink-0">
          {branch.pulledFrom && (
            <button
              type="button"
              className="flow-action-pull shrink-0"
              title={`Pull from ${branch.pulledFrom}`}
              onClick={(e) => e.stopPropagation()}
            >
              <PullArrowIcon />
              <span>Pull from {branch.pulledFrom}</span>
            </button>
          )}
          {branch.mergeInto && (
            <button
              type="button"
              className="flow-action-push shrink-0"
              title={`Push / merge into ${branch.mergeInto}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>Push → {branch.mergeInto}</span>
              <PushArrowIcon />
            </button>
          )}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Left}
        style={{ 
          opacity: 0,
          left: '-8px', // Position at left edge
          top: '50%',
        }}
      />
    </>
  );
}

export const ListNode = memo(ListNodeComponent);
