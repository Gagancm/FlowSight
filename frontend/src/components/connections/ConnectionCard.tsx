import type { Tool } from '../../types/connections';

interface ConnectionCardProps {
  tool: Tool;
  onClick?: () => void;
}

export function ConnectionCard({ tool, onClick }: ConnectionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-[var(--card-border-radius)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)] text-2xl">
        {tool.icon === 'github' && '📦'}
        {tool.icon === 'jira' && '📋'}
        {tool.icon === 'slack' && '💬'}
        {tool.icon === 'confluence' && '📄'}
        {tool.icon === 'servicenow' && '🔧'}
      </div>
      <span className="font-medium">{tool.name}</span>
    </button>
  );
}
