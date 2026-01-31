import { Avatar } from '../shared/Avatar';
import { Button } from '../shared/Button';
import { StatusIndicator } from '../shared/StatusIndicator';
import type { BranchDetail } from '../../types/flow';
import { useEffect, useState } from 'react';

interface BranchHoverPanelProps {
  branch: BranchDetail | null;
  position?: { x: number; y: number } | null;
  onClose?: () => void;
  isPinned?: boolean;
}

export function BranchHoverPanel({ branch, position, onClose, isPinned }: BranchHoverPanelProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger animation when panel appears (branch changes)
  useEffect(() => {
    if (branch) {
      setAnimate(true);
      // Reset after animation completes
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [branch?.id]); // Re-trigger when branch changes

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
        pointerEvents: 'auto',
        ...positionStyle,
      }}
    >
      {/* Close button when pinned */}
      {isPinned && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
        <StatusIndicator status={branch.status} pulse={branch.status === 'critical'} animate={animate} />
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
