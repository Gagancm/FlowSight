import { motion } from 'framer-motion';
import { ChatInterface } from '../components/ai-insights/ChatInterface';

export function AIInsightsPage() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col min-w-0 overflow-hidden"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <ChatInterface />
      </div>
    </motion.div>
  );
}
