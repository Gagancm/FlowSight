import { ChatInterface } from '../components/ai-insights/ChatInterface';

export function AIInsightsPage() {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="flex-1 flex flex-col min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}
