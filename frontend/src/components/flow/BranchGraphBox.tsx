import { motion } from 'framer-motion';
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
  index?: number;
}

export function BranchGraphBox({ branch, depth, onHover, index = 0 }: BranchGraphBoxProps) {
  const indent = depth * INDENT_PER_LEVEL;

  return (
    <motion.div
      style={{ paddingLeft: indent }}
      className="w-full min-w-0"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        onMouseEnter={() => onHover?.(branch)}
        onMouseLeave={() => onHover?.(null)}
        onFocus={() => onHover?.(branch)}
        onBlur={() => onHover?.(null)}
        className={cn(
          'flow-branch-card flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]'
        )}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
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
      </motion.div>
    </motion.div>
  );
}
