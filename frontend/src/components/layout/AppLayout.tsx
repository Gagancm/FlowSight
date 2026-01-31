import { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { Tab } from './Sidebar';

interface AppLayoutProps {
  children: (activeTab: Tab) => React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('connections');

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
          {children(activeTab)}
        </main>
      </div>
    </div>
  );
}
