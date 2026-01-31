import { cn } from '../../utils/helpers';

interface StatusIndicatorProps {
  status: 'critical' | 'warning' | 'success' | 'neutral';
  className?: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, className, pulse }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'var(--color-critical)';
      case 'warning':
        return 'var(--color-warning)';
      case 'success':
        return 'var(--color-success)';
      case 'neutral':
      default:
        return 'var(--color-neutral)';
    }
  };

  const color = getStatusColor();

  // Render different icons based on status
  const renderIcon = () => {
    switch (status) {
      case 'critical':
        // X mark in circle (error/blocked)
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="none" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'warning':
        // Alert triangle
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'success':
        // Check mark in circle
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="none" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'neutral':
      default:
        // Simple circle
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="none" />
          </svg>
        );
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        pulse && status === 'critical' && 'animate-pulse',
        className
      )}
    >
      {renderIcon()}
    </span>
  );
}
