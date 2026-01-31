import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getAccentStyles = () => {
    switch (type) {
      case 'error':
        return { icon: 'text-[var(--color-critical)]', glow: 'shadow-[0_0_12px_var(--color-critical-glow)]' };
      case 'warning':
        return { icon: 'text-[var(--color-warning)]', glow: 'shadow-[0_0_12px_var(--color-warning-glow)]' };
      case 'success':
        return { icon: 'text-[var(--color-success)]', glow: 'shadow-[0_0_12px_var(--color-success-glow)]' };
      case 'info':
      default:
        return { icon: 'text-[var(--color-brand-orange)]', glow: 'shadow-[0_0_12px_var(--color-brand-orange-glow)]' };
    }
  };

  const accent = getAccentStyles();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      className={`
        fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[calc(100vw-2rem)]
        bg-[#222222] outline outline-1 outline-[#2A2C30]
        shadow-[4px_4px_12px_rgba(16,17,19,0.6),-2px_-2px_8px_rgba(36,37,41,0.15),-1px_-1px_2px_rgba(52,52,52,0.4)_inset,1px_1px_2px_rgba(16,17,19,0.25)_inset]
      `}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className={`flex-shrink-0 ${accent.icon}`}>{getIcon()}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{message}</span>
      <motion.button
        onClick={onClose}
        className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-lg leading-none flex-shrink-0"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        ×
      </motion.button>
    </motion.div>
  );
}
