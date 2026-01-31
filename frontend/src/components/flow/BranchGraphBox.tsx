import { StatusIndicator } from '../shared/StatusIndicator';
import type { Branch } from '../../types/flow';
import { cn } from '../../utils/helpers';

const INDENT_PER_LEVEL = 28;

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

export interface BranchGraphBoxProps {
  branch: Branch;
  depth: number;
  onHover?: (branch: Branch | null) => void;
}

export function BranchGraphBox({ branch, depth, onHover }: BranchGraphBoxProps) {
  const indent = depth * INDENT_PER_LEVEL;

  return (
    <div
      style={{ paddingLeft: indent }}
      className="w-full min-w-0"
    >
      <div
        role="button"
        tabIndex={0}
        onMouseEnter={() => onHover?.(branch)}
        onMouseLeave={() => onHover?.(null)}
        onFocus={() => onHover?.(branch)}
        onBlur={() => onHover?.(null)}
        className={cn(
          'branch-graph-box flex items-center gap-3 rounded-xl border px-4 py-3 transition-all',
          'bg-[var(--color-bg-secondary)] border-[var(--color-border)]',
          'hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-light)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] cursor-pointer'
        )}
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
            <span className="flex items-center gap-1.5 rounded bg-[var(--color-accent-bg)] px-2 py-1 text-xs text-[var(--color-link)]" title={`Pull from ${branch.pulledFrom}`}>
              <PullArrowIcon />
              <span>Pull from {branch.pulledFrom}</span>
            </span>
          )}
          {branch.mergeInto && (
            <span className="flex items-center gap-1.5 rounded bg-[var(--color-success-bg)] px-2 py-1 text-xs text-[var(--color-success)]" title={`Push / merge into ${branch.mergeInto}`}>
              <span>Push → {branch.mergeInto}</span>
              <PushArrowIcon />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
