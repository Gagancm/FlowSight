import { AppLayout } from './components/layout/AppLayout';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { FlowPage } from './pages/FlowPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import type { Tab } from './components/layout/Sidebar';

function App() {
  return (
    <AppLayout>
      {(activeTab: Tab) => {
        switch (activeTab) {
          case 'connections':
            return <ConnectionsPage />;
          case 'flow':
            return <FlowPage />;
          case 'ai-insights':
            return <AIInsightsPage />;
          default:
            return <FlowPage />;
        }
      }}
    </AppLayout>
  );
}

export default App;
