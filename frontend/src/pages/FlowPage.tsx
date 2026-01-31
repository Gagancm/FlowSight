import { useState, useRef, useEffect } from 'react';

// SVG Icons for action buttons (Flow page has fewer actions than Connections - no add button)
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M5.64 5.64l2.83 2.83" />
    <path d="M15.54 15.54l2.83 2.83" />
    <path d="M5.64 18.36l2.83-2.83" />
    <path d="M15.54 8.46l2.83-2.83" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const MoveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

import { BranchGraph } from '../components/flow/BranchGraph';

const GRAPH_OPTIONS = [
  { value: 'github', label: 'Github Graph' },
  { value: 'pr', label: 'PR Graph' },
  { value: 'timeline', label: 'Timeline' },
] as const;

export function FlowPage() {
  const [selectedGraph, setSelectedGraph] = useState<(typeof GRAPH_OPTIONS)[number]['value']>('github');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = GRAPH_OPTIONS.find((o) => o.value === selectedGraph)?.label ?? 'Github Graph';

  return (
    <div className="absolute inset-0 flex">
      {/* Main Canvas Area */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* Toolbar above graph: dropdown left, action buttons right */}
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <span>{currentLabel}</span>
              <ChevronDownIcon />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[160px] py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg z-[var(--z-dropdown)]">
                {GRAPH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedGraph(opt.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedGraph === opt.value
                        ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="w-11 h-11 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors" title="Download">
              <DownloadIcon />
            </button>
            <button type="button" className="w-11 h-11 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors" title="View graph">
              <AIIcon />
            </button>
          </div>
        </div>

        {/* Branch graph: rectangle boxes with hierarchy (Graph tab) */}
        <div className="flex-1 overflow-auto p-4">
          <BranchGraph />
        </div>

        {/* Bottom left canvas controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button type="button" className="w-11 h-11 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <MoveIcon />
          </button>
          <button type="button" className="w-11 h-11 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <ZoomInIcon />
          </button>
          <button type="button" className="w-11 h-11 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <ZoomOutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
