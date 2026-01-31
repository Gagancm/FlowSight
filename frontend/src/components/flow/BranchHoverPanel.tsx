import { Avatar } from '../shared/Avatar';
import { Button } from '../shared/Button';
import { StatusIndicator } from '../shared/StatusIndicator';
import type { BranchDetail } from '../../types/flow';

interface BranchHoverPanelProps {
  branch: BranchDetail | null;
  position?: { x: number; y: number } | null;
}

export function BranchHoverPanel({ branch, position }: BranchHoverPanelProps) {
  if (!branch) return null;

  const { bottleneck, recommendation } = branch;
  const ownerDisplay = branch.owner ?? branch.author ?? '—';

  // Calculate position - if position provided, place next to node, otherwise fixed right
  const positionStyle = position
    ? {
        position: 'absolute' as const,
        left: `${position.x + 650}px`, // 650px to the right of the node (node width ~600px + gap)
        top: `${position.y}px`,
        transform: 'translateY(-20%)', // Slight vertical adjustment
      }
    : {
        position: 'fixed' as const,
        right: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
      };

  return (
    <div
      className="flow-hover-panel w-[360px] p-5 transition-all duration-300"
      style={{ 
        fontFamily: 'var(--font-sans)', 
        zIndex: 2000,
        ...positionStyle,
      }}
    >
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
        <StatusIndicator status={branch.status} pulse={branch.status === 'critical'} />
        {branch.name}
      </h3>
      <section className="mb-4">
        <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Owner</h4>
        <div className="flex items-center gap-2">
          <Avatar name={ownerDisplay} size="sm" className="neu-avatar-circle flex items-center justify-center text-[var(--color-text-secondary)]" />
          <span className="text-[var(--color-text-primary)]">{ownerDisplay}</span>
          {branch.ownerTeam && (
            <span className="text-sm text-[var(--color-text-muted)]">· {branch.ownerTeam}</span>
          )}
        </div>
      </section>
      {branch.jiraTicket && (
        <section className="mb-4">
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Jira ticket</h4>
          <p className="text-sm text-[var(--color-text-primary)]">
            {branch.jiraTicket}: {branch.jiraTitle}
          </p>
          {branch.jiraStatus && (
            <p className="text-xs text-[var(--color-text-muted)]">Status: {branch.jiraStatus}</p>
          )}
        </section>
      )}
      {bottleneck && (
        <section className="mb-4 rounded-xl bg-[var(--color-critical-bg)] p-3 outline outline-1 outline-[var(--color-critical-border)]">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-critical)]">
            Bottleneck detected
          </h4>
          <p className="text-sm text-[var(--color-text-primary)]">
            Wait: {bottleneck.waitTimeHours}h ({bottleneck.deviationFactor}x team avg)
          </p>
          <p className="text-sm text-[var(--color-text-primary)]">Blocking: {bottleneck.blockingCount} features</p>
        </section>
      )}
      {recommendation && (
        <section className="mb-4 rounded-xl bg-[var(--color-success-bg)] p-3 outline outline-1 outline-[var(--color-success-border)]">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-success)]">AI recommendation</h4>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{recommendation.action}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{recommendation.rationale}</p>
          {recommendation.expectedImpact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Impact: {recommendation.expectedImpact}
            </p>
          )}
          <Button size="sm" variant="secondary" className="mt-3">
            Assign Emma
          </Button>
        </section>
      )}
    </div>
  );
}
