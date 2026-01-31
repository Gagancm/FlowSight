import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from 'reactflow';
import type { ReactFlowInstance, Node } from 'reactflow';
import { ToolsSidebar } from '../components/connections/ToolsSidebar';
import { ConnectionCanvas, type ConnectionProject } from '../components/connections/ConnectionCanvas';
import '../styles/components/connections.css';
import '../styles/components/flow.css';

// SVG Icons for action buttons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CONNECTIONS_PROJECTS_KEY = 'flowsight-connections-projects';
const CONNECTIONS_LAST_PROJECT_KEY = 'flowsight-connections-last-project';

function generateProjectId() {
  return `project-${Date.now()}`;
}

function loadProjects(): ConnectionProject[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

function saveProjects(projects: ConnectionProject[]) {
  try {
    localStorage.setItem(CONNECTIONS_PROJECTS_KEY, JSON.stringify(projects));
  } catch {}
}

function loadLastProjectId(projects: ConnectionProject[]): string | null {
  try {
    const id = localStorage.getItem(CONNECTIONS_LAST_PROJECT_KEY);
    if (id && projects.some((p) => p.id === id)) return id;
  } catch {}
  return projects[0]?.id ?? null;
}

export function ConnectionsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [projects, setProjects] = useState<ConnectionProject[]>(() => loadProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() =>
    loadLastProjectId(loadProjects())
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (currentProjectId) {
      try {
        localStorage.setItem(CONNECTIONS_LAST_PROJECT_KEY, currentProjectId);
      } catch {}
    }
  }, [currentProjectId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddProjectClick = () => {
    setNewProjectName('');
    setShowAddProjectModal(true);
    setDropdownOpen(false);
  };

  const handleAddProjectConfirm = () => {
    const name = newProjectName.trim() || 'Untitled';
    const newProject: ConnectionProject = {
      id: generateProjectId(),
      name,
      nodes: [],
      edges: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    setShowAddProjectModal(false);
    setNewProjectName('');
  };

  const handleDropRequestProject = (payload: { tool: { id: string; name: string; icon: string }; position: { x: number; y: number } }) => {
    const newNode: Node = {
      id: `${payload.tool.id}-${Date.now()}`,
      type: 'toolNode',
      position: payload.position,
      data: {
        tool: payload.tool.id,
        name: payload.tool.name,
        icon: payload.tool.icon,
        status: 'inactive',
      },
    };
    const newProject: ConnectionProject = {
      id: generateProjectId(),
      name: 'Untitled',
      nodes: [newNode],
      edges: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
  };

  const handleSelectProject = (id: string) => {
    if (id === '__add__') {
      handleAddProjectClick();
      return;
    }
    if (id === currentProjectId) {
      setDropdownOpen(false);
      return;
    }
    if (currentProjectId && reactFlowInstance) {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProjectId ? { ...p, nodes, edges } : p
        )
      );
    }
    setCurrentProjectId(id);
    setDropdownOpen(false);
  };

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
      reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col sm:flex-row"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Main Canvas Area - shrinks when sidebar opens */}
      <div className="flex-1 relative overflow-hidden min-h-0 min-w-0">
        {/* Top-left: Add Project button / Project dropdown - responsive padding for mobile hamburger */}
        <div className="absolute top-4 left-4 sm:left-4 md:left-4 z-10 pl-14 lg:pl-0" ref={dropdownRef}>
          {projects.length === 0 ? (
            <motion.button
              type="button"
              onClick={handleAddProjectClick}
              className="flow-dropdown-trigger flex items-center gap-2 px-4 py-2.5 text-sm min-w-[140px] sm:min-w-[160px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Add Project</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flow-dropdown-trigger flex items-center justify-between gap-2 min-w-[140px] sm:min-w-[160px] px-4 py-2.5 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="truncate">{currentProject?.name ?? 'Select project'}</span>
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
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProject(p.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-md ${
                          currentProjectId === p.id
                            ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSelectProject('__add__')}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors rounded-md border-t border-[var(--color-border)] mt-1 pt-2"
                    >
                      + Add Project
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* React Flow Canvas - always visible, empty when no project */}
        <div className="absolute inset-0">
          <ReactFlowProvider>
            <ConnectionCanvas
              key={currentProject?.id ?? 'no-project'}
              initialNodes={currentProject?.nodes ?? []}
              initialEdges={currentProject?.edges ?? []}
              noProjectMode={!currentProject}
              onDropRequestProject={handleDropRequestProject}
              onInit={setReactFlowInstance}
            />
          </ReactFlowProvider>
        </div>

        {/* Right side action buttons - fixed position, responsive spacing */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <motion.button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSidebarOpen ? <CloseIcon /> : <PlusIcon />}
          </motion.button>
          <motion.button className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <DownloadIcon />
          </motion.button>
          <motion.button
            onClick={() => (window.location.hash = 'ai-insights')}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AIIcon />
          </motion.button>
        </div>

        {/* Bottom left canvas controls - responsive */}
        <div className="absolute bottom-4 left-4 pl-14 lg:pl-0 flex gap-2 z-10">
          <motion.button
            onClick={handleFitView}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoveIcon />
          </motion.button>
          <motion.button
            onClick={handleZoomIn}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomInIcon />
          </motion.button>
          <motion.button
            onClick={handleZoomOut}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomOutIcon />
          </motion.button>
        </div>
      </div>

      {/* Right Sidebar with Tools - Animated width */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            className="h-full overflow-hidden flex-shrink-0 connections-tools-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="w-80 min-w-[280px] sm:w-80 h-full">
              <ToolsSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
}
