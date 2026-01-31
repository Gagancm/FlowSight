import { Avatar } from '../shared/Avatar';
import { Button } from '../shared/Button';
import type { BranchDetail } from '../../types/flow';

interface BranchHoverPanelProps {
  branch: BranchDetail | null;
}

export function BranchHoverPanel({ branch }: BranchHoverPanelProps) {
  if (!branch) return null;

  const { bottleneck, recommendation } = branch;

  return (
    <div className="fixed right-[var(--space-lg)] top-1/2 z-[var(--z-hover-panel)] w-[360px] -translate-y-1/2 rounded-[var(--card-border-radius)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-xl transition-all duration-300">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span>{branch.status === 'critical' ? '🔴' : branch.status === 'warning' ? '⚠️' : '✅'}</span>
        {branch.name}
      </h3>
      <section className="mb-4">
        <h4 className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">OWNER</h4>
        <div className="flex items-center gap-2">
          <Avatar name={branch.owner} size="sm" />
          <span>{branch.owner}</span>
          {branch.ownerTeam && (
            <span className="text-sm text-[var(--color-text-muted)]">· {branch.ownerTeam}</span>
          )}
        </div>
      </section>
      {branch.jiraTicket && (
        <section className="mb-4">
          <h4 className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">JIRA TICKET</h4>
          <p className="text-sm">
            {branch.jiraTicket}: {branch.jiraTitle}
          </p>
          {branch.jiraStatus && (
            <p className="text-xs text-[var(--color-text-muted)]">Status: {branch.jiraStatus}</p>
          )}
        </section>
      )}
      {bottleneck && (
        <section className="mb-4 rounded-lg bg-[var(--color-critical-bg)] p-3">
          <h4 className="mb-2 text-xs font-medium text-[var(--color-critical)]">
            BOTTLENECK DETECTED
          </h4>
          <p className="text-sm">
            Wait: {bottleneck.waitTimeHours}h ({bottleneck.deviationFactor}x team avg)
          </p>
          <p className="text-sm">Blocking: {bottleneck.blockingCount} features</p>
        </section>
      )}
      {recommendation && (
        <section className="mb-4 rounded-lg bg-[var(--color-success-bg)] p-3">
          <h4 className="mb-2 text-xs font-medium text-[var(--color-success)]">AI RECOMMENDATION</h4>
          <p className="text-sm font-medium">{recommendation.action}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{recommendation.rationale}</p>
          {recommendation.expectedImpact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Impact: {recommendation.expectedImpact}
            </p>
          )}
          <Button size="sm" className="mt-3">
            Assign Emma
          </Button>
        </section>
      )}
    </div>
  );
}
