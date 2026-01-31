import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import '../../styles/components/sidebar.css';
import '../../styles/components/ai-insights.css';

export type Tab = 'connections' | 'flow' | 'ai-insights';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
  onOpenMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

// SVG Icons (20x20 to match action button icons)
const ConnectionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const FlowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const AIInsightsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M5.64 5.64l2.83 2.83" />
    <path d="M15.54 15.54l2.83 2.83" />
    <path d="M5.64 18.36l2.83-2.83" />
    <path d="M15.54 8.46l2.83-2.83" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-closer-icon">
    <line x1="5" y1="7" x2="19" y2="7" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="5" y1="17" x2="19" y2="17" />
  </svg>
);

const TABS = [
  { id: 'connections' as const, label: 'CONNECTIONS', icon: ConnectionsIcon },
  { id: 'flow' as const, label: 'FLOW', icon: FlowIcon },
  { id: 'ai-insights' as const, label: 'AI INSIGHTS', icon: AIInsightsIcon },
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
  onToggleCollapse,
  isMobile,
  onMobileMenuClose,
}: SidebarProps) {
  const handleCloserClick = () => {
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    } else {
      onToggleCollapse?.();
    }
  };

  return (
    <motion.aside
      className={cn('sidebar flex flex-col', collapsed && 'sidebar--collapsed')}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Sidebar closer / mobile close - circular button (outside sidebar-content so it isn't clipped) */}
      {(onToggleCollapse || (isMobile && onMobileMenuClose)) && (
        <motion.button
          type="button"
          onClick={handleCloserClick}
          className="sidebar-closer"
          aria-label={isMobile ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <HamburgerIcon />
        </motion.button>
      )}
      {/* Inner content clipped during width transition; button stays visible */}
      <div className="sidebar-content flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* Logo and Title */}
        <motion.div
          className={cn('sidebar-logo-container', collapsed && 'sidebar-logo-container--collapsed')}
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div className="neu-diamond-outer neu-diamond-outer--sidebar" aria-hidden>
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
        </motion.div>
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
