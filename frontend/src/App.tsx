import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { FlowPage } from './pages/FlowPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import type { Tab } from './components/layout/Sidebar';

const pageVariants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

const pageTransition = { type: 'tween' as const, duration: 0.25, ease: [0.4, 0, 0.2, 1] as const };

function App() {
  return (
    <AppLayout>
      {(activeTab: Tab) => (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="absolute inset-0"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {activeTab === 'connections' && <ConnectionsPage />}
            {activeTab === 'flow' && <FlowPage />}
            {activeTab === 'ai-insights' && <AIInsightsPage />}
            {activeTab !== 'connections' && activeTab !== 'flow' && activeTab !== 'ai-insights' && <FlowPage />}
          </motion.div>
        </AnimatePresence>
      )}
    </AppLayout>
  );
}

export default App;
