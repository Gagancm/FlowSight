import { cn } from '../../utils/helpers';

interface StatusIndicatorProps {
  status: 'critical' | 'warning' | 'success' | 'neutral';
  className?: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, className, pulse }: StatusIndicatorProps) {
  const icons = {
    critical: '🔴',
    warning: '⚠️',
    success: '✅',
    neutral: '⚪',
  };

  return (
    <span
      className={cn(
        'inline-flex',
        pulse && status === 'critical' && 'animate-pulse',
        className
      )}
    >
      {icons[status]}
    </span>
  );
}
