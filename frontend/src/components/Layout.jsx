import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Calculator, Calendar, Settings, RefreshCw, LogOut, AlertTriangle, AlertCircle, CheckCircle2, X, Sparkles, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';

export default function Layout() {
  const activeTheme = useStore(state => state.activeTheme);
  const syncHacData = useStore(state => state.syncHacData);
  const isSyncing = useStore(state => state.isSyncing);
  const logout = useStore(state => state.logout);
  const syncNotification = useStore(state => state.syncNotification);
  const clearSyncNotification = useStore(state => state.clearSyncNotification);
  const [isDismissing, setIsDismissing] = useState(false);
  const theme = getTheme(activeTheme);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-dismiss successful sync notifications: stay for ~1.2s then slide upwards out of screen
  useEffect(() => {
    if (syncNotification && syncNotification.type === 'success') {
      setIsDismissing(false);
      const exitTimer = setTimeout(() => {
        setIsDismissing(true);
      }, 1200);

      const removeTimer = setTimeout(() => {
        clearSyncNotification();
        setIsDismissing(false);
      }, 1800);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    } else {
      setIsDismissing(false);
    }
  }, [syncNotification, clearSyncNotification]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      clearSyncNotification();
      setIsDismissing(false);
    }, 450);
  };

  const handleSync = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSyncing) return;
    try {
      await syncHacData();
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  };

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    logout();
    navigate('/login');
  };

  const tabs = [
    { name: 'Overview',   path: '/overview',   icon: <Home size={21} /> },
    { name: 'Grades',     path: '/grades',     icon: <BookOpen size={21} /> },
    { name: 'Planner',    path: '/planner',    icon: <Calendar size={21} /> },
    { name: 'GPA',        path: '/gpa',        icon: <Calculator size={21} /> },
    { name: 'Settings',   path: '/settings',   icon: <Settings size={21} /> },
  ];

  return (
    <div className={`h-screen flex flex-col md:flex-row ${theme.appBg}`}>
      
      {/* Desktop Sidebar */}
      <nav className={`hidden md:flex flex-col w-64 ${theme.sidebarBg} border-r ${theme.sidebarBorder} shrink-0 transition-colors duration-200`}>
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl ${theme.bgClass} flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20`}>
              ▲
            </div>
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight ${theme.isDark ? 'text-white' : theme.textClass}`}>Ascend</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all font-medium text-sm ${
                  isActive
                    ? `${theme.lightBgClass} ${theme.textClass} font-bold shadow-xs`
                    : theme.sidebarInactive
                }`
              }
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                <span>{tab.name}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto pb-20 md:pb-0 relative ${theme.appBg}`}>
        
        {/* Top-Center Sync Notification Pop-up with slide-up exit */}
        {syncNotification && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto min-w-[320px] transition-all duration-500 ease-in-out pointer-events-auto ${
              isDismissing
                ? '-translate-y-[220%] opacity-0 pointer-events-none scale-95'
                : 'translate-y-0 opacity-100 scale-100 animate-in fade-in slide-in-from-top-4 duration-300'
            }`}
          >
            <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center justify-between gap-3.5 backdrop-blur-md ${
              theme.isDark
                ? syncNotification.type === 'success'
                  ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/40'
                  : syncNotification.type === 'warning'
                  ? 'bg-amber-950/95 text-amber-100 border-amber-500/40 shadow-amber-950/40'
                  : syncNotification.type === 'syncing'
                  ? 'bg-slate-900/95 text-slate-100 border-slate-700/80'
                  : 'bg-red-950/95 text-red-100 border-red-500/40 shadow-red-950/40'
                : syncNotification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200 shadow-emerald-950/10'
                  : syncNotification.type === 'warning'
                  ? 'bg-amber-50 text-amber-950 border-amber-200 shadow-amber-950/10'
                  : syncNotification.type === 'syncing'
                  ? `${theme.lightBgClass} ${theme.textPrimary} border ${theme.borderClass} shadow-md`
                  : 'bg-red-50 text-red-950 border-red-200 shadow-red-950/10'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {syncNotification.type === 'success' && (
                  <CheckCircle2 size={19} className="text-emerald-500 shrink-0" />
                )}
                {syncNotification.type === 'warning' && (
                  <AlertTriangle size={19} className="text-amber-500 shrink-0" />
                )}
                {syncNotification.type === 'error' && (
                  <AlertCircle size={19} className="text-red-500 shrink-0" />
                )}
                {syncNotification.type === 'syncing' && (
                  <RefreshCw size={17} className={`${theme.textClass} animate-spin shrink-0`} />
                )}
                
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-xs leading-tight truncate">
                    {syncNotification.title}
                  </span>
                  <span className={`text-[11px] ${theme.isDark ? 'opacity-80' : 'text-gray-600'} leading-tight truncate mt-0.5`}>
                    {syncNotification.message}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(syncNotification.type === 'warning' || syncNotification.type === 'error') && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                      theme.isDark
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : `${theme.bgClass} text-white hover:opacity-90 shadow-2xs`
                    }`}
                  >
                    <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                    <span>Retry</span>
                  </button>
                )}
                {syncNotification.type !== 'syncing' && (
                  <button
                    onClick={handleDismiss}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      theme.isDark
                        ? 'text-white/60 hover:text-white hover:bg-white/10'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                    }`}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Top-Right Corner Action Buttons - Fixed z-[90] for instant clickability */}
        <div className="fixed top-5 right-5 z-[90] flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-2xl text-xs backdrop-blur-md transition shadow-md border cursor-pointer ${
              theme.isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80'
                : 'bg-white/90 hover:bg-white text-gray-900 border-gray-200/80 shadow-gray-900/5'
            }`}
            title="Sync latest data from Home Access Center"
          >
            <RefreshCw size={13} className={`shrink-0 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-1.5 font-bold px-3 py-2 rounded-2xl text-xs backdrop-blur-md transition shadow-md border cursor-pointer ${
              theme.isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80'
                : 'bg-white/90 hover:bg-white text-gray-900 border-gray-200/80 shadow-gray-900/5'
            }`}
            title="Log out of account"
          >
            <LogOut size={14} className="shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 w-full ${theme.sidebarBg} border-t ${theme.sidebarBorder} safe-area-pb z-50 transition-colors duration-200`}>
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-colors ${
                  isActive ? theme.textClass : theme.isDark ? 'text-slate-400' : 'text-gray-400'
                }`
              }
            >
              {tab.icon}
              <span className="text-[9px] font-medium leading-none">{tab.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
