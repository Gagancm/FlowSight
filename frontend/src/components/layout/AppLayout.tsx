import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { Tab } from './Sidebar';

const TAB_FROM_HASH: Record<string, Tab> = {
  flow: 'flow',
  'ai-insights': 'ai-insights',
};
const DEFAULT_TAB: Tab = 'connections';

function getTabFromHash(): Tab {
  const hash = window.location.hash.slice(1).toLowerCase();
  return TAB_FROM_HASH[hash] ?? DEFAULT_TAB;
}

interface AppLayoutProps {
  children: (activeTab: Tab) => React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const hash = tab === DEFAULT_TAB ? '' : tab;
    const newUrl = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, []);

  return (
    <div
      className="relative flex min-h-screen overflow-visible"
      style={{ background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 49%, #252525 100%)' }}
    >
      <div
        className="sidebar-wrapper absolute flex shrink-0 flex-col"
        style={{ left: 19, top: 15, width: 'var(--sidebar-width)', height: 'calc(100vh - 30px)' }}
      >
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ marginLeft: 'calc(19px + var(--sidebar-width) + 20px)' }}
      >
        {activeTab !== 'ai-insights' && <Navbar />}
        <main className="relative flex-1 overflow-hidden" style={{ background: 'transparent' }}>
          {children(activeTab)}
        </main>
      </div>
    </div>
  );
}
