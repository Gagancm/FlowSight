import { cn } from '../../utils/helpers';

interface BadgeProps {
  status?: 'critical' | 'warning' | 'success' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'critical' && 'bg-[var(--color-critical-bg)] text-[var(--color-critical)]',
        status === 'warning' && 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        status === 'success' && 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        status === 'neutral' && 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]',
        className
      )}
    >
      {children}
    </span>
  );
}
