import { useState } from 'react';
import { AVAILABLE_TOOLS } from '../../services/mockData';
import type { Tool } from '../../types/connections';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ToolsSidebarProps {
  onToolDragStart?: (tool: Tool) => void;
  onClose?: () => void;
}

export function ToolsSidebar({ onToolDragStart, onClose }: ToolsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = AVAILABLE_TOOLS.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (tool: Tool) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(tool));
    e.dataTransfer.effectAllowed = 'move';
    onToolDragStart?.(tool);
  };

  // Get icon component based on tool type
  const getToolIcon = (icon: string) => {
    const iconMap: Record<string, JSX.Element> = {
      github: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      ),
      jira: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"/>
        </svg>
      ),
      slack: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      ),
      confluence: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.87 18.257c-.248.382-.463.734-.656 1.063a1.48 1.48 0 0 0 .35 2.079l3.484 2.456a1.53 1.53 0 0 0 2.13-.372c.185-.304.379-.621.59-.95 1.69-2.633 3.234-3.479 6.035-2.407.53.203 1.135.434 1.815.69a1.495 1.495 0 0 0 1.916-.803l1.233-3.886a1.477 1.477 0 0 0-.826-1.877c-.669-.255-1.315-.503-1.932-.736-5.32-2.03-8.476-.493-11.139 4.743zM23.13 5.743c.248-.382.463-.734.656-1.063a1.48 1.48 0 0 0-.35-2.079L20.952.145a1.53 1.53 0 0 0-2.13.372c-.185.304-.379.621-.59.95-1.69 2.633-3.234 3.479-6.035 2.407a94.933 94.933 0 0 0-1.815-.69 1.495 1.495 0 0 0-1.916.803L7.233 7.873a1.477 1.477 0 0 0 .826 1.877c.669.255 1.315.503 1.932.736 5.32 2.03 8.476.493 11.139-4.743z"/>
        </svg>
      ),
      servicenow: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S6.698 2.4 12 2.4s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/>
          <path d="M13.2 6h-2.4v6.3l5.1 3.1 1.2-1.9-3.9-2.3z"/>
        </svg>
      ),
    };
    return iconMap[icon] || (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    );
  };

  // Get category display name
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      version_control: 'Version Control',
      project_management: 'Project Management',
      communication: 'Communication',
      crm: 'Service Management',
    };
    return categories[category] || category;
  };

  // Group tools by category
  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="w-80 h-full border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      {/* Header with close button */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Add Tools</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-6">
            {/* Category Header */}
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              {getCategoryName(category)}
            </h3>

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  draggable
                  onDragStart={handleDragStart(tool)}
                  className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] cursor-grab active:cursor-grabbing hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] transition-all duration-200"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-all duration-200 group-hover:text-[var(--color-accent)] group-hover:scale-110">
                    {getToolIcon(tool.icon)}
                  </div>

                  {/* Name */}
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-center">
                    {tool.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-[var(--color-text-muted)]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              No tools found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Drag tools to canvas to add them
        </p>
      </div>
    </div>
  );
}
