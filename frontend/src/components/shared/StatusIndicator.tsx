import { cn } from '../../utils/helpers';

interface StatusIndicatorProps {
  status: 'critical' | 'warning' | 'success' | 'neutral';
  className?: string;
  pulse?: boolean;
  animate?: boolean; // New prop to control animation
}

export function StatusIndicator({ status, className, pulse, animate = false }: StatusIndicatorProps) {
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
        // Animated X mark in circle (error/blocked)
        return (
          <svg width="16" height="16" viewBox="0 0 52 52" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none"
              className={animate ? 'status-animate-circle' : ''}
              style={{
                strokeDasharray: '166',
                strokeDashoffset: animate ? '166' : '0'
              }}
            />
            <line 
              x1="16" 
              y1="16" 
              x2="36" 
              y2="36"
              className={animate ? 'status-animate-line' : ''}
              style={{
                strokeDasharray: '28',
                strokeDashoffset: animate ? '28' : '0'
              }}
            />
            <line 
              x1="36" 
              y1="16" 
              x2="16" 
              y2="36"
              className={animate ? 'status-animate-line' : ''}
              style={{
                strokeDasharray: '28',
                strokeDashoffset: animate ? '28' : '0'
              }}
            />
          </svg>
        );
      case 'warning':
        // Animated alert triangle
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path 
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              className={animate ? 'status-animate-circle' : ''}
              style={{
                strokeDasharray: '70',
                strokeDashoffset: animate ? '70' : '0'
              }}
            />
            <line 
              x1="12" 
              y1="9" 
              x2="12" 
              y2="13"
              className={animate ? 'status-animate-line' : ''}
              style={{
                strokeDasharray: '4',
                strokeDashoffset: animate ? '4' : '0'
              }}
            />
            <line 
              x1="12" 
              y1="17" 
              x2="12.01" 
              y2="17"
              className={animate ? 'status-animate-dot' : ''}
              style={{
                strokeDasharray: '0.1',
                strokeDashoffset: animate ? '0.1' : '0'
              }}
            />
          </svg>
        );
      case 'success':
        // Animated check mark in circle
        return (
          <svg width="16" height="16" viewBox="0 0 52 52" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none"
              className={animate ? 'status-animate-circle' : ''}
              style={{
                strokeDasharray: '166',
                strokeDashoffset: animate ? '166' : '0'
              }}
            />
            <path 
              d="M14 27l7 7 16-16"
              className={animate ? 'status-animate-check' : ''}
              style={{
                strokeDasharray: '29',
                strokeDashoffset: animate ? '29' : '0'
              }}
            />
          </svg>
        );
      case 'neutral':
      default:
        // Simple circle (no animation)
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
