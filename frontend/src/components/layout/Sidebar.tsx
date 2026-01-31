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
}: SidebarProps) {
  return (
    <motion.aside
      className={cn('sidebar flex flex-col', collapsed && 'sidebar--collapsed')}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Inner content clipped during width transition; collapse button is in AppLayout wrapper */}
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
