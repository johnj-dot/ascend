import React, { useEffect, useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { getTheme } from './utils/themeConfig';
import { onAppEvent, APP_EVENTS } from './utils/appEvents';
import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Grades from './pages/Grades';
import GPA from './pages/GPA';
import Planner from './pages/Planner';
import Settings from './pages/Settings';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ascend ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#131b2e] border border-slate-800 rounded-3xl p-8 max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-black">
              ▲
            </div>
            <h2 className="text-xl font-black">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ascend recovered gracefully from an unexpected error. Your saved data is completely safe.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/overview';
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const hacData = useStore(state => state.hacData);
  if (!hacData) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const activeTheme = useStore(state => state.activeTheme);
  const theme = getTheme(activeTheme);
  const [, setEventTick] = useState(0);

  useEffect(() => {
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0a0f1d';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    }
  }, [theme.isDark]);

  // Real-time zero-lag sync across tabs and components
  useEffect(() => {
    const unsubTask = onAppEvent(APP_EVENTS.TASK_ADDED, () => setEventTick(t => t + 1));
    const unsubComp = onAppEvent(APP_EVENTS.TASK_COMPLETED, () => setEventTick(t => t + 1));
    const unsubDel  = onAppEvent(APP_EVENTS.TASK_DELETED, () => setEventTick(t => t + 1));
    const unsubDocA = onAppEvent(APP_EVENTS.DOC_ADDED, () => setEventTick(t => t + 1));
    const unsubDocD = onAppEvent(APP_EVENTS.DOC_DELETED, () => setEventTick(t => t + 1));
    const unsubGrd  = onAppEvent(APP_EVENTS.GRADE_UPDATED, () => setEventTick(t => t + 1));
    const unsubThm  = onAppEvent(APP_EVENTS.THEME_CHANGED, () => setEventTick(t => t + 1));

    return () => {
      unsubTask();
      unsubComp();
      unsubDel();
      unsubDocA();
      unsubDocD();
      unsubGrd();
      unsubThm();
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className={`min-h-screen ${theme.appBg} font-sans ${theme.textPrimary}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/overview"    element={<Overview />} />
              <Route path="/grades"      element={<Grades />} />
              <Route path="/planner"     element={<Planner />} />
              <Route path="/attendance"  element={<Navigate to="/planner" />} />
              <Route path="/gpa"         element={<GPA />} />
              <Route path="/settings"    element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/overview" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
