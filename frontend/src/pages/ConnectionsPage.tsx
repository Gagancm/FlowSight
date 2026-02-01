import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from 'reactflow';
import type { ReactFlowInstance, Node } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ToolsSidebar } from '../components/connections/ToolsSidebar';
import { ConnectionCanvas, type ConnectionProject } from '../components/connections/ConnectionCanvas';
import { saveConnectionsContextForAI } from '../utils/aiContext';
import type { AIConnectionsContext } from '../utils/aiContext';
import '../styles/components/connections.css';
import '../styles/components/flow.css';

// SVG Icons for action buttons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** Same size as PencilIcon (14x14) for dropdown alignment */
const PlusIconSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const CONNECTIONS_PROJECTS_KEY = 'flowsight-connections-projects';
const CONNECTIONS_LAST_PROJECT_KEY = 'flowsight-connections-last-project';
const CURRENT_PROJECT_KEY = 'flowsight-current-project'; // Shared across all pages

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
  
  // First time load - create default Project Alpha with GitHub node
  const defaultProject: ConnectionProject = {
    id: generateProjectId(),
    name: 'Project Alpha',
    nodes: [
      {
        id: `github-${Date.now()}`,
        type: 'toolNode',
        position: { x: 250, y: 200 },
        data: {
          tool: 'github',
          name: 'GitHub',
          icon: 'github',
          status: 'inactive',
        },
      } as Node,
    ],
    edges: [],
  };
  
  // Save the default project to localStorage
  try {
    localStorage.setItem(CONNECTIONS_PROJECTS_KEY, JSON.stringify([defaultProject]));
  } catch {}
  
  return [defaultProject];
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
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    // Load shared current project from localStorage
    try {
      const savedProjectName = localStorage.getItem(CURRENT_PROJECT_KEY);
      
      // If key exists and is 'None', user explicitly deselected - keep it None
      if (savedProjectName === 'None') {
        return null;
      }
      
      // If key exists with a project name, load that project
      if (savedProjectName) {
        const loadedProjects = loadProjects();
        const project = loadedProjects.find(p => p.name === savedProjectName);
        return project?.id ?? null;
      }
      
      // If key doesn't exist at all, this is first time load - select first project
      const loadedProjects = loadProjects();
      if (loadedProjects.length > 0) {
        const firstProject = loadedProjects[0];
        // Also set it in localStorage
        try {
          localStorage.setItem(CURRENT_PROJECT_KEY, firstProject.name);
        } catch {}
        return firstProject.id;
      }
    } catch {}
    
    return null;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const downloadCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Sync current project name to shared localStorage
  useEffect(() => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    try {
      if (currentProject) {
        localStorage.setItem(CURRENT_PROJECT_KEY, currentProject.name);
        localStorage.setItem(CONNECTIONS_LAST_PROJECT_KEY, currentProjectId);
      } else {
        localStorage.setItem(CURRENT_PROJECT_KEY, 'None');
        localStorage.removeItem(CONNECTIONS_LAST_PROJECT_KEY);
      }
    } catch {}
  }, [currentProjectId, projects]);

  // Listen for storage changes from other tabs/pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURRENT_PROJECT_KEY && e.newValue) {
        const newProjectName = e.newValue === 'None' ? null : e.newValue;
        if (newProjectName) {
          const project = projects.find(p => p.name === newProjectName);
          if (project && project.id !== currentProjectId) {
            setCurrentProjectId(project.id);
          }
        } else if (currentProjectId !== null) {
          setCurrentProjectId(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentProjectId, projects]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
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

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const editProject = editProjectId ? projects.find((p) => p.id === editProjectId) : null;
  const deleteConfirmMatches = editProject != null && deleteConfirmName.trim() === editProject.name;

  const handleAddProjectClick = () => {
    setNewProjectName('');
    setShowAddProjectModal(true);
    setDropdownOpen(false);
  };

  const handleAddProjectConfirm = () => {
    const name = newProjectName.trim() || 'Project Alpha';
    
    // Create default GitHub node for new projects
    const githubNode: Node = {
      id: `github-${Date.now()}`,
      type: 'toolNode',
      position: { x: 250, y: 200 },
      data: {
        tool: 'github',
        name: 'GitHub',
        icon: 'github',
        status: 'inactive',
      },
    };
    
    const newProject: ConnectionProject = {
      id: generateProjectId(),
      name,
      nodes: [githubNode],
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
      name: 'Project Alpha',
      nodes: [newNode],
      edges: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
  };

  const openEditProject = (projectId: string) => {
    const p = projects.find((pr) => pr.id === projectId);
    if (p) {
      setEditProjectId(projectId);
      setEditProjectName(p.name);
    }
  };

  const handleEditProjectClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    openEditProject(projectId);
  };

  const handleEditProjectSave = () => {
    if (!editProjectId) return;
    const name = editProjectName.trim() || 'Project Alpha';
    setProjects((prev) =>
      prev.map((p) => (p.id === editProjectId ? { ...p, name } : p))
    );
    setEditProjectId(null);
    setEditProjectName('');
  };

  const handleEditProjectDeleteClick = () => {
    setDeleteConfirmName('');
    setShowDeleteConfirm(true);
  };

  const handleEditProjectDeleteConfirm = () => {
    if (!editProjectId || !deleteConfirmMatches) return;
    setProjects((prev) => prev.filter((p) => p.id !== editProjectId));
    if (currentProjectId === editProjectId) {
      const remaining = projects.filter((p) => p.id !== editProjectId);
      setCurrentProjectId(remaining[0]?.id ?? null);
    }
    setEditProjectId(null);
    setEditProjectName('');
    setDeleteConfirmName('');
    setShowDeleteConfirm(false);
    setDropdownOpen(false);
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
      reactFlowInstance.fitView({
        duration: 200,
      });
    }
  };

  const getFlowElement = useCallback(() => {
    return document.querySelector('#connections-flow-export .react-flow') as HTMLElement | null;
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
      link.download = `${currentProject?.name ?? 'connections'}.svg`;
      link.href = dataUrl;
      link.click();
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as SVG failed:', err);
    }
  }, [getFlowElement, currentProject?.name]);

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
      pdf.save(`${currentProject?.name ?? 'connections'}.pdf`);
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as PDF failed:', err);
    }
  }, [getFlowElement, currentProject?.name]);

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
      link.download = `${currentProject?.name ?? 'connections'}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadDropdownOpen(false);
    } catch (err) {
      console.error('Export as image failed:', err);
    }
  }, [getFlowElement, currentProject?.name]);

  /** Build connections context from current project and save it, then go to AI Insights. */
  const handleAIClick = useCallback(() => {
    const nodes = reactFlowInstance ? reactFlowInstance.getNodes() : currentProject?.nodes ?? [];
    const edges = reactFlowInstance ? reactFlowInstance.getEdges() : currentProject?.edges ?? [];
    const projectName = currentProject?.name ?? 'Project Alpha';
    const projectId = currentProject?.id ?? '';

    const idToName = new Map<string, string>();
    const tools: { id: string; name: string }[] = [];
    for (const node of nodes) {
      const name = (node.data?.name as string) || (node.data?.tool as string) || node.id;
      idToName.set(node.id, name);
      tools.push({ id: node.id, name });
    }
    const edgesWithLabels = edges.map((e) => ({
      sourceLabel: idToName.get(e.source) ?? e.source,
      targetLabel: idToName.get(e.target) ?? e.target,
    }));

    const context: AIConnectionsContext = {
      projectId,
      projectName,
      tools,
      edges: edgesWithLabels,
    };
    saveConnectionsContextForAI(context);
    window.location.hash = 'ai-insights';
  }, [reactFlowInstance, currentProject]);

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
          <div className="flex items-center gap-1 min-w-[140px] sm:min-w-[160px]">
            <motion.button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flow-dropdown-trigger flex flex-1 min-w-0 items-center justify-between gap-2 px-4 py-2.5 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="truncate">{currentProject?.name ?? 'Select Project'}</span>
              <ChevronDownIcon />
            </motion.button>
            {currentProject && (
              <motion.button
                type="button"
                onClick={() => openEditProject(currentProject.id)}
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg neu-btn-icon text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Edit project"
                aria-label="Edit project"
              >
                <PencilIcon />
              </motion.button>
            )}
          </div>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="absolute top-full left-0 mt-2 min-w-[160px] py-1 flow-dropdown-panel z-[var(--z-dropdown)]"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* None option to deselect */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProjectId(null);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors h-9 flex items-center rounded-md ${
                    currentProjectId === null
                      ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="truncate block">None</span>
                </button>
                
                {/* Project list */}
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center w-full rounded-md group ${
                      currentProjectId === p.id
                        ? 'bg-[var(--color-accent-bg)]'
                        : 'hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectProject(p.id)}
                      className={`flex-1 min-w-0 text-left px-4 py-2.5 text-sm transition-colors h-9 flex items-center ${
                        currentProjectId === p.id
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                          <span className="truncate block">{p.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            handleEditProjectClick(e, p.id);
                            setDropdownOpen(false);
                          }}
                          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                          title="Edit project"
                          aria-label="Edit project"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSelectProject('__add__')}
                      className="w-full flex items-center px-4 h-9 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors rounded-md border-t border-[var(--color-border)] mt-1"
                    >
                      <span className="shrink-0 flex items-center justify-center w-9 h-9 -ml-1">
                        <PlusIconSmall />
                      </span>
                      <span className="text-left">Add Project</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
          {/* + button always visible */}
          <motion.button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSidebarOpen ? <CloseIcon /> : <PlusIcon />}
          </motion.button>

          {/* Download and AI buttons only when project selected */}
          {currentProject && (
            <>
              <div
                className="relative flex items-center justify-center"
                ref={downloadDropdownRef}
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
            onClick={handleAIClick}
            className="neu-btn-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Open AI Insights with this project's connections"
            aria-label="Open AI Insights with project context"
          >
            <AIIcon />
          </motion.button>
            </>
          )}
        </div>

        {/* Bottom left canvas controls - responsive (hide when no project) */}
        {currentProject && (
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
        )}

        {/* Bottom right - connection status legend (hide when no project) */}
        {currentProject && (
          <div className="connections-legend neu-btn-icon absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 px-3 py-2.5">
          <div className="connections-legend-row flex items-center gap-2">
            <span className="connections-legend-dot connections-legend-dot--inactive" />
            <span className="connections-legend-label text-xs text-[var(--color-text-secondary)]">Inactive</span>
          </div>
          <div className="connections-legend-row flex items-center gap-2">
            <span className="connections-legend-dot connections-legend-dot--connected" />
            <span className="connections-legend-label text-xs text-[var(--color-text-secondary)]">Connected, awaiting data</span>
          </div>
          <div className="connections-legend-row flex items-center gap-2">
            <span className="connections-legend-dot connections-legend-dot--active" />
            <span className="connections-legend-label text-xs text-[var(--color-text-secondary)]">Operational</span>
          </div>
          </div>
        )}
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

      {/* Edit Project modal – rename and delete */}
      <AnimatePresence>
        {editProjectId != null && editProject != null && (
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditProjectSave();
                }}
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

      {/* Delete project confirmation – type project name to confirm (GitHub-style, app theme) */}
      <AnimatePresence>
        {showDeleteConfirm && editProject != null && (
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
                If you delete this project you will be losing all the connections and flow of this project. If you still want to proceed, enter the project name below.
              </p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Type <span className="font-semibold text-[var(--color-critical)]">{editProject.name}</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteConfirmMatches) handleEditProjectDeleteConfirm();
                }}
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
