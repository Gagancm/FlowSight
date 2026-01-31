import { cn } from '../../utils/helpers';

export type Tab = 'connections' | 'flow' | 'ai-insights';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
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

const TABS = [
  { id: 'connections' as const, label: 'CONNECTIONS', icon: ConnectionsIcon },
  { id: 'flow' as const, label: 'FLOW', icon: FlowIcon },
  { id: 'ai-insights' as const, label: 'AI INSIGHTS', icon: AIInsightsIcon },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="flex h-screen flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Empty space matching top bar height */}
      <div style={{ height: 'var(--navbar-height)' }} />
      <nav className="flex flex-1 flex-col gap-2 px-3 pt-4">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex h-11 min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium tracking-wide transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <IconComponent />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
