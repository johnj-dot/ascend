import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Smartphone, Palette, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { THEMES, getTheme } from '../utils/themeConfig';
import { fireNotification, playNotificationSound } from '../utils/notifications';

function Switch({ active, onToggle, theme }) {
  const activeTrack = theme.id === 'midnight'
    ? 'bg-emerald-500 border-emerald-400 shadow-sm'
    : `${theme.bgClass} border-transparent shadow-sm`;

  const inactiveTrack = theme.isDark
    ? 'bg-slate-800 border-slate-700/80'
    : 'bg-gray-200 border-gray-300';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-all duration-200 outline-none border cursor-pointer relative ${
        active ? activeTrack : inactiveTrack
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-200 ease-spring ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ThemeSwatch({ themeData, isSelected, isDarkApp }) {
  const clipId = `clip-${themeData.id}`;
  return (
    <div
      className={`relative w-11 h-11 rounded-2xl p-0.5 transition-all duration-150 ${
        isSelected
          ? isDarkApp
            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
            : 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white scale-105'
          : 'hover:scale-105 opacity-80 hover:opacity-100'
      }`}
    >
      <svg className="w-full h-full rounded-[14px] overflow-hidden shadow-xs" viewBox="0 0 44 44">
        <defs>
          <clipPath id={clipId}>
            <rect width="44" height="44" rx="14" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="44" height="44" fill={themeData.splitBottom} />
          <polygon points="0,0 44,0 0,44" fill={themeData.splitTop} />
        </g>
      </svg>

      {isSelected && (
        <div className={`absolute inset-0 m-auto w-5 h-5 ${themeData.id === 'midnight' ? 'bg-emerald-500' : themeData.bgClass} text-white rounded-full shadow-md flex items-center justify-center pointer-events-none`}>
          <Check size={12} strokeWidth={3.5} />
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const logout = useStore(state => state.logout);
  const hacData = useStore(state => state.hacData);
  const syncHacData = useStore(state => state.syncHacData);
  const isSyncing = useStore(state => state.isSyncing);
  const activeThemeId = useStore(state => state.activeTheme);
  const setTheme = useStore(state => state.setTheme);
  const settings = useStore(state => state.localOverrides?.settings) || { notifications: true, incognito: false, offline: true };
  const toggleSetting = useStore(state => state.toggleSetting);
  const navigate = useNavigate();

  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const theme = getTheme(activeThemeId);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleNotifications = async () => {
    const nextVal = !settings.notifications;
    toggleSetting('notifications');

    if (nextVal) {
      playNotificationSound();
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            const permPromise = Notification.requestPermission();
            const timeoutPromise = new Promise(res => setTimeout(() => res('timeout'), 3000));
            await Promise.race([permPromise, timeoutPromise]);
          } catch {
            // ignore
          }
        }
        if (Notification.permission === 'granted') {
          await fireNotification('🔔 Ascend Notifications Enabled', 'You will receive alerts for grade updates and assignments.');
        }
      }
      setFeedbackMsg('Push notifications enabled.');
    } else {
      setFeedbackMsg('Push notifications disabled.');
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleToggleOffline = () => {
    const nextVal = !settings.offline;
    if (nextVal) {
      setFeedbackMsg('Offline access enabled. Grade profile cached locally.');
    } else {
      setFeedbackMsg('Offline caching disabled. Local cache cleared.');
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
    toggleSetting('offline');
  };

  const handleSync = async () => {
    try {
      await syncHacData();
    } catch {
      // Handled by store sync notification
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`${theme.appBg} w-full flex flex-col transition-colors duration-200`}>
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full`}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold">Settings</h1>
        </div>
      </div>

      <div className={`${theme.appBg} flex-1 px-4 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Account Profile Card */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-4 flex items-center gap-4 transition-colors duration-200`}>
            <div className={`${theme.lightBgClass} ${theme.textClass} p-3 rounded-2xl shrink-0`}>
              <User size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold ${theme.textPrimary} text-base truncate`}>{hacData?.studentName || 'Student'}</h3>
              <p className={`text-xs ${theme.textSecondary}`}>{hacData?.school || 'School'}</p>
            </div>
          </div>

          {/* Sync HAC Data Section */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-4 flex items-center justify-between gap-3 transition-colors duration-200`}>
            <div className="flex items-center gap-3">
              <div className={`${theme.lightBgClass} ${theme.textClass} p-2.5 rounded-xl`}>
                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </div>
              <div>
                <h4 className={`font-bold ${theme.textPrimary} text-sm`}>Home Access Center Sync</h4>
                <p className={`text-xs ${theme.textSecondary}`}>Sync latest grades, assignments, and attendance</p>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.bgClass} text-white shadow-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1.5`}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Theme Selector Section */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-5 transition-colors duration-200`}>
            <div className="flex items-center gap-3 mb-4">
              <Palette size={20} className={theme.isDark ? 'text-slate-400' : 'text-gray-400'} />
              <div>
                <h4 className={`font-bold ${theme.textPrimary} text-sm`}>App Theme</h4>
                <p className={`text-xs ${theme.textSecondary}`}>Select your preferred color style</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {THEMES.map(t => {
                const isSelected = activeThemeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex flex-col items-center gap-1.5 group outline-none cursor-pointer"
                    title={t.name}
                  >
                    <ThemeSwatch themeData={t} isSelected={isSelected} isDarkApp={theme.isDark} />
                    <span className={`text-[10px] font-bold ${
                      isSelected ? (theme.isDark ? 'text-white' : 'text-gray-900') : theme.textMuted
                    }`}>
                      {t.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Toggle Settings */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden divide-y ${theme.divideColor} transition-colors duration-200`}>
            {/* Push Notifications */}
            <div className="px-4 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} className={theme.isDark ? 'text-slate-400' : 'text-gray-400'} />
                  <div>
                    <h4 className={`font-bold ${theme.textPrimary} text-sm`}>Push Notifications</h4>
                    <p className={`text-xs ${theme.textSecondary}`}>Get alerts for new grades & absences</p>
                  </div>
                </div>
                <Switch active={!!settings.notifications} onToggle={handleToggleNotifications} theme={theme} />
              </div>

              {settings.notifications && (
                <div className="pt-0.5">
                  <p className={`text-[11px] ${theme.textMuted} leading-normal`}>
                    System alerts and pleasant audio chimes are active for new grades and schedule updates.
                  </p>
                </div>
              )}
            </div>

            {/* Offline Access */}
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className={theme.isDark ? 'text-slate-400' : 'text-gray-400'} />
                  <div>
                    <h4 className={`font-bold ${theme.textPrimary} text-sm`}>Offline Access</h4>
                    <p className={`text-xs ${theme.textSecondary}`}>Cache profile locally for instant loading</p>
                  </div>
                </div>
                <Switch active={!!settings.offline} onToggle={handleToggleOffline} theme={theme} />
              </div>

              <div className="pt-0.5 flex items-center justify-between">
                <span className={`text-[11px] flex items-center gap-1.5 ${theme.textMuted}`}>
                  {isOnline ? (
                    <>
                      <Wifi size={13} className="text-emerald-500" />
                      <span>{settings.offline ? 'Profile cached locally for instant offline loading' : 'Offline caching disabled'}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={13} className="text-amber-500" />
                      <span>Offline mode • Serving cached profile</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold text-center border animate-in fade-in slide-in-from-top-2 duration-150 ${
              theme.isDark ? 'bg-slate-800 border-slate-700 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-800 shadow-md'
            }`}>
              {feedbackMsg}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full ${theme.isDark ? 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-950/60' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'} font-bold py-4 rounded-2xl border transition flex justify-center items-center gap-2 shadow-sm text-sm cursor-pointer`}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
