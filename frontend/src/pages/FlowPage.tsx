import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from 'reactflow';
import { BranchFlowCanvas } from '../components/flow/BranchFlowCanvas';
import { BranchHoverPanel } from '../components/flow/BranchHoverPanel';
import { useFlowData } from '../hooks/useFlowData';
import { useHoverPanel } from '../hooks/useHoverPanel';
import type { Branch, BranchDetail } from '../types/flow';
import '../styles/components/flow.css';

// SVG Icons for action buttons (Flow page - same set as Connections)
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

const GRAPH_OPTIONS = [
  { value: 'list', label: 'List View' },
  { value: 'github', label: 'Github Graph' },
  { value: 'pr', label: 'PR Graph' },
  { value: 'timeline', label: 'Timeline' },
] as const;

export function FlowPage() {
  const [selectedGraph, setSelectedGraph] = useState<(typeof GRAPH_OPTIONS)[number]['value']>('list');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [hoverNodePosition, setHoverNodePosition] = useState<{ x: number; y: number } | null>(null);
  const { getBranchDetail } = useFlowData();
  const { hoveredItem, onHover } = useHoverPanel<Branch>();

  const hoveredDetail: BranchDetail | null = hoveredItem
    ? (getBranchDetail(hoveredItem.id) ?? ({ ...hoveredItem } as BranchDetail))
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = GRAPH_OPTIONS.find((o) => o.value === selectedGraph)?.label ?? 'List View';

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance) {
      // Use more padding for list view to match default zoom
      const padding = selectedGraph === 'list' ? 0.5 : 0.2;
      reactFlowInstance.fitView({ padding, duration: 200 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col sm:flex-row"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 relative overflow-hidden min-h-0 min-w-0">
        {/* Graph content - React Flow canvas */}
        <div className="absolute inset-0">
          <ReactFlowProvider>
            <BranchFlowCanvas
              onInit={setReactFlowInstance}
              onHover={onHover}
              onHoverPosition={setHoverNodePosition}
              viewType={selectedGraph}
            />
          </ReactFlowProvider>
        </div>

        {/* Top-left: graph type dropdown - responsive padding for mobile hamburger */}
        <div className="absolute top-4 left-4 z-10 pl-14 lg:pl-0" ref={dropdownRef}>
          <motion.button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flow-dropdown-trigger flex items-center gap-2 px-4 py-2.5 text-sm min-w-[140px] sm:min-w-[160px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{currentLabel}</span>
            <ChevronDownIcon />
          </motion.button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="absolute top-full left-0 mt-2 min-w-[160px] py-1 flow-dropdown-panel z-[var(--z-dropdown)]"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {GRAPH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedGraph(opt.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-md ${
                      selectedGraph === opt.value
                        ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top-right: action buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <motion.button type="button" className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center" title="Download" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <DownloadIcon />
          </motion.button>
          <motion.button
            type="button"
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            title="AI Insights"
            onClick={() => { window.location.hash = 'ai-insights'; }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AIIcon />
          </motion.button>
        </div>

        {/* Bottom-left: canvas controls - responsive padding for mobile hamburger */}
        <div className="absolute bottom-4 left-4 pl-14 lg:pl-0 flex gap-2 z-10">
          <motion.button
            type="button"
            onClick={handleFitView}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            title="Fit view"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoveIcon />
          </motion.button>
          <motion.button
            type="button"
            onClick={handleZoomIn}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            title="Zoom in"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomInIcon />
          </motion.button>
          <motion.button
            type="button"
            onClick={handleZoomOut}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            title="Zoom out"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomOutIcon />
          </motion.button>
        </div>
      </div>

      {/* Hover Panel - branch details on hover */}
      <BranchHoverPanel branch={hoveredDetail} position={hoverNodePosition} />
    </motion.div>
  );
}
