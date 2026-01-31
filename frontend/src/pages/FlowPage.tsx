import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
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

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIconSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
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
  { value: 'list', label: 'Github Graph' },
  { value: 'github', label: 'Branch Timeline' },
  { value: 'pr', label: 'PR Graph' },
  { value: 'timeline', label: 'Timeline' },
] as const;

export function FlowPage() {
  const [selectedGraph, setSelectedGraph] = useState<(typeof GRAPH_OPTIONS)[number]['value']>('list');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [currentProjectName, setCurrentProjectName] = useState('Untitled');
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const downloadCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [hoverNodePosition, setHoverNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [pinnedBranch, setPinnedBranch] = useState<Branch | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<{ x: number; y: number } | null>(null);
  const { getBranchDetail } = useFlowData();
  const { hoveredItem, onHover } = useHoverPanel<Branch>();

  const deleteConfirmMatches = currentProjectName && deleteConfirmName.trim() === currentProjectName;

  // Show pinned if exists, otherwise show hovered
  const displayBranch = pinnedBranch || hoveredItem;
  const displayPosition = pinnedBranch ? pinnedPosition : hoverNodePosition;

  const hoveredDetail: BranchDetail | null = displayBranch
    ? (getBranchDetail(displayBranch.id) ?? ({ ...displayBranch } as BranchDetail))
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
      const target = e.target as HTMLElement | null;
      if (downloadDropdownRef.current && target && !downloadDropdownRef.current.contains(target)) {
        setDownloadDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (downloadCloseTimerRef.current) {
        clearTimeout(downloadCloseTimerRef.current);
      }
    };
  }, []);

  const currentLabel = GRAPH_OPTIONS.find((o) => o.value === selectedGraph)?.label ?? 'Github Graph';

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

  // Handle card click to pin the hover panel
  const handleNodeClick = (branch: Branch, position: { x: number; y: number }) => {
    setPinnedBranch(branch);
    setPinnedPosition(position);
  };

  // Clear pinned panel
  const handleClearPinned = () => {
    setPinnedBranch(null);
    setPinnedPosition(null);
  };

  // Add Project handlers
  const handleAddProjectClick = () => {
    setNewProjectName('');
    setShowAddProjectModal(true);
    setProjectDropdownOpen(false);
  };

  const handleAddProjectConfirm = () => {
    const name = newProjectName.trim() || 'Untitled';
    setCurrentProjectName(name);
    setShowAddProjectModal(false);
    setNewProjectName('');
  };

  // Edit Project handlers
  const openEditProject = () => {
    setEditProjectId('current'); // Dummy ID since we only have one project
    setEditProjectName(currentProjectName);
    setProjectDropdownOpen(false);
  };

  const handleEditProjectSave = () => {
    const name = editProjectName.trim() || 'Untitled';
    setCurrentProjectName(name);
    setEditProjectId(null);
    setEditProjectName('');
  };

  const handleEditProjectDeleteClick = () => {
    setDeleteConfirmName('');
    setShowDeleteConfirm(true);
  };

  const handleEditProjectDeleteConfirm = () => {
    if (!deleteConfirmMatches) return;
    setCurrentProjectName('Untitled');
    setEditProjectId(null);
    setEditProjectName('');
    setDeleteConfirmName('');
    setShowDeleteConfirm(false);
    setProjectDropdownOpen(false);
  };

  const handleDeleteConfirmClose = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmName('');
  };

  const handleEditProjectClose = () => {
    setEditProjectId(null);
    setEditProjectName('');
    setShowDeleteConfirm(false);
    setDeleteConfirmName('');
  };

  // Export handlers
  const getFlowElement = useCallback(() => {
    return document.querySelector('#flow-export .react-flow') as HTMLElement | null;
  }, []);

  const handleExportAsSvg = useCallback(async () => {
    const element = getFlowElement();
    if (!element) return;
    try {
      const dataUrl = await toSvg(element, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim() || '#1a1a1a',
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList?.contains('react-flow__controls')) return false;
          if (el.classList?.contains('react-flow__minimap')) return false;
          return true;
        },
      });
      const link = document.createElement('a');
      link.download = `${currentProjectName}-flow.svg`;
      link.href = dataUrl;
      link.click();
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as SVG failed:', err);
    }
  }, [getFlowElement, currentProjectName]);

  const handleExportAsPdf = useCallback(async () => {
    const element = getFlowElement();
    if (!element) return;
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim() || '#1a1a1a',
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList?.contains('react-flow__controls')) return false;
          if (el.classList?.contains('react-flow__minimap')) return false;
          return true;
        },
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`${currentProjectName}-flow.pdf`);
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as PDF failed:', err);
    }
  }, [getFlowElement, currentProjectName]);

  const handleExportAsImage = useCallback(async () => {
    const element = getFlowElement();
    if (!element) return;
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim() || '#1a1a1a',
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList?.contains('react-flow__controls')) return false;
          if (el.classList?.contains('react-flow__minimap')) return false;
          return true;
        },
      });
      const link = document.createElement('a');
      link.download = `${currentProjectName}-flow.png`;
      link.href = dataUrl;
      link.click();
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as Image failed:', err);
    }
  }, [getFlowElement, currentProjectName]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col sm:flex-row"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 relative overflow-hidden min-h-0 min-w-0">
        {/* Graph content - React Flow canvas */}
        <div className="absolute inset-0" id="flow-export">
          <ReactFlowProvider>
            <BranchFlowCanvas
              onInit={setReactFlowInstance}
              onHover={onHover}
              onHoverPosition={setHoverNodePosition}
              onNodeClick={handleNodeClick}
              viewType={selectedGraph}
            />
          </ReactFlowProvider>
        </div>

        {/* Top-left: Graph type dropdown and Project dropdown - responsive padding for mobile hamburger */}
        <div className="absolute top-4 left-4 z-10 pl-14 lg:pl-0 flex items-center gap-2">
          {/* Graph type dropdown */}
          <div ref={dropdownRef} className="relative">
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

          {/* Project Dropdown with Edit Icon */}
          <div ref={projectDropdownRef} className="relative flex items-center gap-1 min-w-[140px] sm:min-w-[160px]">
            <motion.button
              type="button"
              onClick={() => setProjectDropdownOpen((o) => !o)}
              className="flow-dropdown-trigger flex flex-1 min-w-0 items-center justify-between gap-2 px-4 py-2.5 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="truncate">{currentProjectName}</span>
              <ChevronDownIcon />
            </motion.button>
            <motion.button
              type="button"
              onClick={openEditProject}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg neu-btn-icon text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Edit project"
              aria-label="Edit project"
            >
              <PencilIcon />
            </motion.button>
            <AnimatePresence>
              {projectDropdownOpen && (
                <motion.div
                  className="absolute top-full left-0 mt-2 min-w-[160px] py-1 flow-dropdown-panel z-[var(--z-dropdown)]"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center w-full rounded-md bg-[var(--color-accent-bg)]">
                    <button
                      type="button"
                      onClick={() => setProjectDropdownOpen(false)}
                      className="flex-1 min-w-0 text-left px-4 py-2.5 text-sm transition-colors h-9 flex items-center text-[var(--color-accent)]"
                    >
                      <span className="truncate block">{currentProjectName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditProject();
                        setProjectDropdownOpen(false);
                      }}
                      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      title="Edit project"
                      aria-label="Edit project"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProjectClick}
                    className="w-full flex items-center px-4 h-9 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors rounded-md border-t border-[var(--color-border)] mt-1"
                  >
                    <span className="shrink-0 flex items-center justify-center w-9 h-9 -ml-1">
                      <PlusIconSmall />
                    </span>
                    <span>Add Project</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Top-right: action buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <div
            ref={downloadDropdownRef}
            className="relative"
            onMouseEnter={() => {
              if (downloadCloseTimerRef.current) {
                clearTimeout(downloadCloseTimerRef.current);
                downloadCloseTimerRef.current = null;
              }
              setDownloadDropdownOpen(true);
            }}
            onMouseLeave={() => {
              downloadCloseTimerRef.current = setTimeout(() => {
                setDownloadDropdownOpen(false);
                downloadCloseTimerRef.current = null;
              }, 150);
            }}
          >
            <AnimatePresence>
              {downloadDropdownOpen && (
                <motion.div
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-2 min-w-[140px] py-1 flow-dropdown-panel z-[var(--z-dropdown)]"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={handleExportAsSvg}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-md text-left"
                  >
                    Save as SVG
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAsPdf}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-md text-left"
                  >
                    Save as PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAsImage}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-md text-left"
                  >
                    Save as Image
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Download"
              aria-label="Download"
            >
              <DownloadIcon />
            </motion.button>
          </div>
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

        {/* Bottom right - branch status legend */}
        <div className="flow-legend neu-btn-icon absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flow-legend-dot flow-legend-dot--critical" />
            <span className="text-xs text-[var(--color-text-secondary)]">Critical / Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flow-legend-dot flow-legend-dot--warning" />
            <span className="text-xs text-[var(--color-text-secondary)]">Warning / In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flow-legend-dot flow-legend-dot--success" />
            <span className="text-xs text-[var(--color-text-secondary)]">Success / Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flow-legend-dot flow-legend-dot--neutral" />
            <span className="text-xs text-[var(--color-text-secondary)]">Neutral / Pending</span>
          </div>
        </div>
      </div>

      {/* Hover Panel - show on hover or when pinned */}
      {displayBranch && (
        <BranchHoverPanel 
          branch={hoveredDetail} 
          position={displayPosition}
          onClose={handleClearPinned}
          isPinned={!!pinnedBranch}
        />
      )}

      {/* Add Project modal */}
      <AnimatePresence>
        {showAddProjectModal && (
          <motion.div
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAddProjectModal(false)}
          >
            <motion.div
              className="flow-dropdown-panel rounded-2xl p-6 w-full max-w-[320px] min-w-0 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                New Project
              </h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProjectConfirm()}
                placeholder="Project name"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddProjectConfirm}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Project modal */}
      <AnimatePresence>
        {editProjectId != null && (
          <motion.div
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleEditProjectClose}
          >
            <motion.div
              className="flow-dropdown-panel rounded-2xl p-6 w-full max-w-[320px] min-w-0 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                Edit Project
              </h3>
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditProjectSave()}
                placeholder="Project name"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                autoFocus
              />
              <div className="flex justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleEditProjectClose}
                  className="px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditProjectSave}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Save
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={handleEditProjectDeleteClick}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-[var(--color-critical)] hover:bg-[var(--color-critical-bg)] transition-colors"
                >
                  <TrashIcon />
                  Delete project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete project confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-[calc(var(--z-modal)+1)] flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDeleteConfirmClose}
          >
            <motion.div
              className="flow-dropdown-panel rounded-2xl p-6 w-full max-w-[400px] min-w-0 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                Delete project
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                If you delete this project you will be losing all the workflow data. If you still want to proceed, enter the project name below.
              </p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Type <span className="font-semibold text-[var(--color-critical)]">{currentProjectName}</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && deleteConfirmMatches && handleEditProjectDeleteConfirm()}
                placeholder="Project name"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-critical)]"
                autoFocus
              />
              <div className="flex justify-between gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleDeleteConfirmClose}
                  className="px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditProjectDeleteConfirm}
                  disabled={!deleteConfirmMatches}
                  className="px-4 py-2 rounded-lg bg-[var(--color-critical)] text-white hover:bg-[var(--color-critical)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
