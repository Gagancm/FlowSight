/**
 * Animated SVG icons for Sidebar and AI Insights page.
 * Animations are driven by CSS in styles/components/icons.css.
 */

import { cn } from '../../utils/helpers';

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* === Sidebar icons (20x20, animated on tab hover/selected) === */

export function AnimatedConnectionsIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-icon-wrap', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="animated-icon-svg"
        aria-hidden
      >
        <path
          className="icon-connections-path"
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        />
        <path
          className="icon-connections-path"
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        />
      </svg>
    </span>
  );
}

export function AnimatedFlowIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-icon-wrap', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="animated-icon-svg"
        aria-hidden
      >
        <line className="icon-flow-path" x1="6" y1="3" x2="6" y2="15" />
        <circle className="icon-flow-path" cx="18" cy="6" r="3" />
        <circle className="icon-flow-path" cx="6" cy="18" r="3" />
        <path className="icon-flow-path" d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    </span>
  );
}

export function AnimatedAIInsightsIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-icon-wrap', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="animated-icon-svg"
        aria-hidden
      >
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M5.64 5.64l2.83 2.83" />
        <path d="M15.54 15.54l2.83 2.83" />
        <path d="M5.64 18.36l2.83-2.83" />
        <path d="M15.54 8.46l2.83-2.83" />
        <circle className="icon-ai-center" cx="12" cy="12" r="2.5" />
      </svg>
    </span>
  );
}

/* === AI Insights page: Send button (arrow up) === */

export function AnimatedSendIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      {...svgProps}
      strokeWidth={2.5}
      className={cn('animated-icon-svg', className)}
      aria-hidden
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline className="icon-send-arrow" points="5 12 12 5 19 12" />
    </svg>
  );
}

/* === AI Insights page: Attach file === */

export function AnimatedAttachIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      {...svgProps}
      className={cn('animated-icon-svg', className)}
      aria-hidden
    >
      <path
        className="icon-attach-path"
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      />
    </svg>
  );
}

/* === AI Insights page: Quick action icons === */

export function AnimatedBranchIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-quick-icon', 'flex-shrink-0', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="text-[#8b8d93]"
        aria-hidden
      >
        <line className="icon-branch-line" x1="6" y1="3" x2="6" y2="15" />
        <circle cx="6" cy="18" r="3" />
        <path d="M6 9a9 9 0 0 1 9 9" />
      </svg>
    </span>
  );
}

export function AnimatedDocIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-quick-icon', 'flex-shrink-0', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="text-[#8b8d93]"
        aria-hidden
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </span>
  );
}

export function AnimatedChartIcon({ className }: { className?: string }) {
  return (
    <span className={cn('animated-quick-icon', 'flex-shrink-0', className)}>
      <svg
        width="20"
        height="20"
        {...svgProps}
        className="text-[#8b8d93]"
        aria-hidden
      >
        <line className="icon-chart-bar" x1="18" y1="20" x2="18" y2="10" />
        <line className="icon-chart-bar" x1="12" y1="20" x2="12" y2="4" />
        <line className="icon-chart-bar" x1="6" y1="20" x2="6" y2="14" />
      </svg>
    </span>
  );
}
