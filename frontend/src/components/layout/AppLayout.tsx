import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, animate } from 'framer-motion';
import { Sidebar } from './Sidebar';
import type { Tab } from './Sidebar';
import { AnimatedCollapseIcon } from '../shared/AnimatedIcons';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import '../../styles/components/sidebar.css';
import '../../styles/components/icons.css';

/** Overlay background: same as --layout-bg per theme so overlay matches layout when it unmounts */
const THEME_OVERLAY_BG: Record<Theme, string> = {
  dark: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 49%, #252525 100%)',
  light: 'linear-gradient(180deg, #F1F3F5 0%, #E9ECEF 49%, #F5F5F5 100%)',
};

const TAB_FROM_HASH: Record<string, Tab> = {
  flow: 'flow',
  'ai-insights': 'ai-insights',
};
const DEFAULT_TAB: Tab = 'connections';

function getTabFromHash(): Tab {
  const hash = window.location.hash.slice(1).toLowerCase();
  return TAB_FROM_HASH[hash] ?? DEFAULT_TAB;
}

interface AppLayoutProps {
  children: (activeTab: Tab) => React.ReactNode;
}

const MOBILE_BREAKPOINT = 1024;

type ThemeTransitionState = {
  active: boolean;
  origin: { x: number; y: number } | null;
  /** Theme we are wiping away (overlay shows this; hole reveals new theme) */
  overlayTheme: Theme | null;
  /** Radius in px to cover viewport when expanding from logo */
  maxRadius: number;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  const [themeTransition, setThemeTransition] = useState<ThemeTransitionState>({
    active: false,
    origin: null,
    overlayTheme: null,
    maxRadius: 0,
  });
  const maskRadius = useMotionValue(0);

  const handleThemeToggleClick = useCallback(
    (rect: DOMRect) => {
      const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const targetTheme: Theme = theme === 'dark' ? 'light' : 'dark';
      const maxRadius = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight)) + 100;
      // Set new theme immediately so content underneath is new theme; overlay shows OLD theme and we “wipe” a hole to reveal it (game-style reveal).
      setTheme(targetTheme);
      maskRadius.set(0);
      setThemeTransition({ active: true, origin, overlayTheme: theme, maxRadius });
    },
    [theme, setTheme]
  );

  const finishThemeTransition = useCallback(() => {
    setThemeTransition((p) => ({ ...p, active: false, origin: null, overlayTheme: null, maxRadius: 0 }));
  }, []);

  // Animate mask “hole” from 0 to maxRadius so the new theme is revealed as the circle expands (game-style reveal).
  useEffect(() => {
    if (!themeTransition.active || themeTransition.maxRadius <= 0) return;
    const controls = animate(maskRadius, themeTransition.maxRadius, {
      duration: 0.7,
      ease: [0.4, 0, 0.2, 1],
      onComplete: finishThemeTransition,
    });
    return () => controls.stop();
  }, [themeTransition.active, themeTransition.maxRadius, maskRadius, finishThemeTransition]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    const hash = tab === DEFAULT_TAB ? '' : tab;
    const newUrl = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  // Mask template: growing transparent circle reveals new theme underneath (game-style wipe).
  const maskOriginX = themeTransition.origin?.x ?? 0;
  const maskOriginY = themeTransition.origin?.y ?? 0;
  const themeRevealMask = useMotionTemplate`radial-gradient(circle at ${maskOriginX}px ${maskOriginY}px, transparent 0px, transparent ${maskRadius}px, black ${maskRadius}px, black 100%)`;

  return (
    <motion.div
      className="relative flex min-h-screen overflow-visible"
      style={{ background: 'var(--layout-bg)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Theme reveal: overlay = old theme; growing “hole” in mask reveals new theme from diamond (game-style wipe) */}
      <AnimatePresence>
        {themeTransition.active && themeTransition.origin && themeTransition.overlayTheme != null && (
          <motion.div
            className="fixed inset-0 pointer-events-auto"
            style={{
              zIndex: 9999,
              background: THEME_OVERLAY_BG[themeTransition.overlayTheme],
              WebkitMaskImage: themeRevealMask,
              maskImage: themeRevealMask,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[var(--z-modal)] bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Mobile hamburger - open sidebar */}
      <AnimatePresence>
        {isMobile && !mobileMenuOpen && (
          <motion.button
            type="button"
            aria-label="Open menu"
            className="fixed top-4 left-4 z-[var(--z-sticky)] lg:hidden neu-btn-icon w-11 h-11 flex items-center justify-center rounded-xl"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="7" x2="19" y2="7" />
              <line x1="5" y1="12" x2="19" y2="12" />
              <line x1="5" y1="17" x2="19" y2="17" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar: overlay on mobile, inline on desktop. No overflow-hidden here so collapse button (right: -18px) stays visible; clipping is on inner sidebar-content */}
      <motion.div
        className="sidebar-wrapper fixed lg:absolute flex shrink-0 flex-col z-[var(--z-sticky)] h-full lg:h-[calc(100vh-30px)] lg:rounded-[23px]"
        style={{
          left: isMobile ? 0 : 19,
          top: isMobile ? 0 : 15,
          width: isMobile ? 280 : sidebarWidth,
          height: isMobile ? '100vh' : 'calc(100vh - 30px)',
          transition: isMobile ? undefined : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        initial={false}
        animate={
          isMobile
            ? { x: mobileMenuOpen ? 0 : -320 }
            : { x: 0 }
        }
        transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Collapse button: wrapper handles fixed positioning; inner button has scale so transform never conflicts */}
        {((!isMobile) || (isMobile && mobileMenuOpen)) && (
          <div
            className="sidebar-closer-wrapper"
            style={{
              left: isMobile ? 'calc(280px - 18px)' : `calc(19px + ${sidebarWidth} - 18px)`,
            }}
          >
            <motion.button
              type="button"
              onClick={() => (isMobile ? setMobileMenuOpen(false) : setSidebarCollapsed((c) => !c))}
              className="sidebar-closer"
              aria-label={isMobile ? 'Close menu' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <AnimatedCollapseIcon collapsed={isMobile ? false : sidebarCollapsed} />
            </motion.button>
          </div>
        )}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onThemeToggle={toggleTheme}
          onThemeToggleClick={handleThemeToggleClick}
          isMobile={isMobile}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
        />
      </motion.div>

      {/* Main content */}
      <motion.div
        className="main-content flex min-w-0 flex-1 flex-col overflow-hidden w-full"
        style={{
          marginLeft: isMobile ? 0 : `calc(19px + ${sidebarWidth} + 20px)`,
          marginRight: isMobile ? 0 : 19,
          height: isMobile ? '100vh' : 'calc(100vh - 30px)',
          alignSelf: 'center',
          paddingTop: isMobile ? 0 : undefined,
        }}
        initial={false}
      >
        <main className="relative flex-1 overflow-hidden theme-scrollbar min-h-0" style={{ background: 'transparent' }}>
          {children(activeTab)}
        </main>
      </motion.div>
    </motion.div>
  );
}
