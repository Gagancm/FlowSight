import { ConnectionCard } from './ConnectionCard';
import { AVAILABLE_TOOLS } from '../../services/mockData';

export function ConnectionCanvas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connections</h2>
        <button className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]">
          + Add Tool
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {AVAILABLE_TOOLS.map((tool) => (
          <ConnectionCard key={tool.id} tool={tool} />
        ))}
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
        <h3 className="mb-2 text-sm font-medium">Active Connections</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          GitHub ↔ Jira · Jira ↔ Slack · 3 active
        </p>
      </div>
    </div>
  );
}
