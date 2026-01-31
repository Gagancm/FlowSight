import { useState } from 'react';
import { Button } from '../shared/Button';

export function ChatInterface() {
  const [query, setQuery] = useState('');

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
        <h3 className="mb-2 font-semibold">Ask anything about your workflow</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          e.g. &quot;Why is Feature 1 blocked?&quot; or &quot;Who should review PR #247?&quot;
        </p>
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Chat messages will appear here. Powered by watsonx Orchestrate.
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI..."
          className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <Button>Send</Button>
      </div>
    </div>
  );
}
