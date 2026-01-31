import { StatusIndicator } from '../shared/StatusIndicator';
import { Avatar } from '../shared/Avatar';
import type { Branch } from '../../types/flow';
import { cn } from '../../utils/helpers';

interface BranchCardProps {
  branch: Branch;
  onHover?: (branch: Branch | null) => void;
}

export function BranchCard({ branch, onHover }: BranchCardProps) {
  return (
    <div
      onMouseEnter={() => onHover?.(branch)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'flex w-[280px] flex-col gap-2 rounded-[var(--card-border-radius)] border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-lg',
        branch.status === 'critical' &&
          'border-[var(--color-critical)] bg-[var(--color-critical-bg)] shadow-[var(--shadow-critical)]',
        branch.status === 'warning' &&
          'border-[var(--color-warning)] bg-[var(--color-warning-bg)]',
        branch.status === 'success' &&
          'border-[var(--color-success)] bg-[var(--color-success-bg)]',
        branch.status === 'neutral' && 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIndicator status={branch.status} pulse={branch.status === 'critical'} />
        <span className="font-medium truncate">{branch.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar name={branch.author} size="sm" />
        <span className="text-sm text-[var(--color-text-secondary)]">@{branch.author}</span>
      </div>
      {branch.jiraTicket && (
        <div className="text-sm">
          <span className="text-[var(--color-text-muted)]">{branch.jiraTicket}</span>
          {branch.jiraTitle && (
            <span className="ml-1 text-[var(--color-text-secondary)]">· {branch.jiraTitle}</span>
          )}
        </div>
      )}
      {branch.daysWaiting !== undefined && (
        <div className="text-sm text-[var(--color-text-muted)]">
          ⏱️ {branch.daysWaiting}d wait
        </div>
      )}
      {branch.blocking && branch.blocking.length > 0 && (
        <div className="text-xs text-[var(--color-critical)]">
          🔴 Blocking {branch.blocking.length} features
        </div>
      )}
    </div>
  );
}
