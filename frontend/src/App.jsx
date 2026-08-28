import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { getTheme } from './utils/themeConfig';
import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Grades from './pages/Grades';
import GPA from './pages/GPA';
import Planner from './pages/Planner';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const hacData = useStore(state => state.hacData);
  if (!hacData) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const activeTheme = useStore(state => state.activeTheme);
  const theme = getTheme(activeTheme);

  useEffect(() => {
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.isDark]);

  return (
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
  );
}
