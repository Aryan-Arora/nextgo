'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULTS } from './data';
import { pathFor } from './routes';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const router = useRouter();

  const [kpis, setKpis] = useState(DEFAULTS.slice());
  const [kpiOpen, setKpiOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState('ndr');
  const [openGroups, setOpenGroups] = useState({});
  const [stage, setStage] = useState('NDR');
  const [queueTab, setQueueTab] = useState('All');
  const [resolution, setResolution] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [tab, setTabState] = useState({});
  const [vw, setVw] = useState(1440);
  const [theme, setThemeState] = useState('light');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setVw(window.innerWidth);
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem('nx-theme');
    const initial = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem('nx-theme', next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('nx-theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setKpiOpen(false);
        setDrawerOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeTransient = useCallback(() => {
    setNavOpen(false);
    setPaletteOpen(false);
    setKpiOpen(false);
    setDrawerOpen(false);
  }, []);

  const nav = useCallback((id) => {
    closeTransient();
    router.push(pathFor(id));
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [router, closeTransient]);

  const toggleKpi = useCallback((metricId) => {
    setKpis((p) => (p.indexOf(metricId) >= 0 ? p.filter((x) => x !== metricId) : p.concat([metricId])));
  }, []);

  const resetKpi = useCallback(() => setKpis(DEFAULTS.slice()), []);

  const toggleGroup = useCallback((label, fallbackOpen) => {
    setOpenGroups((p) => {
      const current = p[label] === undefined ? fallbackOpen : !!p[label];
      return { ...p, [label]: !current };
    });
  }, []);

  const setTab = useCallback((screenId, label) => {
    setTabState((p) => ({ ...p, [screenId]: label }));
  }, []);

  const toggleExpanded = useCallback((id) => {
    setExpanded((p) => (p === id ? '' : id));
  }, []);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const value = useMemo(() => ({
    kpis, kpiOpen, paletteOpen, drawerOpen, expanded, openGroups, stage, queueTab, resolution, navOpen, tab, vw, theme, toast,
    setKpiOpen, setPaletteOpen, setDrawerOpen, setStage, setQueueTab, setResolution, setNavOpen,
    toggleKpi, resetKpi, toggleGroup, setTab, toggleExpanded, nav, closeTransient, setTheme, toggleTheme, showToast, clearToast,
  }), [kpis, kpiOpen, paletteOpen, drawerOpen, expanded, openGroups, stage, queueTab, resolution, navOpen, tab, vw, theme, toast, toggleKpi, resetKpi, toggleGroup, setTab, toggleExpanded, nav, closeTransient, setTheme, toggleTheme, showToast, clearToast]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
