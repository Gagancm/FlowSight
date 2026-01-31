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
    <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
          {children(activeTab)}
        </main>
      </div>
    </div>
  );
}
