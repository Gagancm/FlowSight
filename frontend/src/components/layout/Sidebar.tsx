import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import {
  AnimatedConnectionsIcon,
  AnimatedFlowIcon,
  AnimatedAIInsightsIcon,
} from '../shared/AnimatedIcons';
import '../../styles/components/sidebar.css';
import '../../styles/components/ai-insights.css';
import '../../styles/components/icons.css';

export type Tab = 'connections' | 'flow' | 'ai-insights';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Immediate theme toggle (no animation). */
  onThemeToggle?: () => void;
  /** Theme toggle with logo-origin for animated overlay. When provided, used instead of onThemeToggle. */
  onThemeToggleClick?: (rect: DOMRect) => void;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
  onOpenMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

const TABS = [
  { id: 'connections' as const, label: 'CONNECTIONS', icon: AnimatedConnectionsIcon },
  { id: 'flow' as const, label: 'FLOW', icon: AnimatedFlowIcon },
  { id: 'ai-insights' as const, label: 'AI INSIGHTS', icon: AnimatedAIInsightsIcon },
];

const tabVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' as const },
  }),
};

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onThemeToggle,
  onThemeToggleClick,
}: SidebarProps) {
  const diamondRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onThemeToggleClick) {
      // Use diamond logo rect so the transition expands from the diamond, not the "F" in Flowsight
      const rect = diamondRef.current?.getBoundingClientRect() ?? e.currentTarget.getBoundingClientRect();
      onThemeToggleClick(rect);
    } else {
      onThemeToggle?.();
    }
  };

  return (
    <motion.aside
      className={cn('sidebar flex flex-col', collapsed && 'sidebar--collapsed')}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Inner content clipped during width transition; collapse button is in AppLayout wrapper */}
      <div className="sidebar-content flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* Logo and Title – click toggles light/dark theme (animated from logo when onThemeToggleClick provided) */}
        <motion.button
          type="button"
          className={cn('sidebar-logo-container', collapsed && 'sidebar-logo-container--collapsed')}
          initial={false}
          animate={{ opacity: 1 }}
          onClick={handleLogoClick}
          aria-label="Toggle light or dark theme"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <div ref={diamondRef} className="neu-diamond-outer neu-diamond-outer--sidebar" aria-hidden>
            <div className="neu-diamond" />
            <div className="neu-diamond neu-diamond-inner" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                className="sidebar-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.18, duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                Flowsight
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <nav className={cn('flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4', collapsed && 'sidebar-nav--collapsed')}>
        {TABS.map((tab, i) => {
          const IconComponent = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <motion.button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={collapsed ? tab.label : undefined}
              className={cn(
                'sidebar-tab flex shrink-0 items-center gap-3 px-4 text-left text-sm font-medium tracking-wide',
                collapsed && 'sidebar-tab--collapsed justify-center px-0',
                isSelected
                  ? 'sidebar-tab--selected text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              )}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              custom={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <IconComponent />
              {!collapsed && <span>{tab.label}</span>}
            </motion.button>
          );
        })}
        </nav>
      </div>
    </motion.aside>
  );
}
