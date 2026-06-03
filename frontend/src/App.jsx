import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import { useState, useEffect } from "react";
import axios from "axios";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminRegister from "./pages/AdminRegister";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudentRegister from "./pages/AdminStudentRegister";
import SystemSetup from "./pages/SystemSetup";

function App() {
  const [isInitialized, setIsInitialized] = useState(null);

  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/setup/status");
        setIsInitialized(res.data.initialized);
      } catch (err) {
        console.error("Failed to check initialization status", err);
        setIsInitialized(false);
      }
    };
    checkInitStatus();
  }, []);

  // Show a blank or loading state while checking status
  if (isInitialized === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>;
  }

  // If not initialized, block EVERYTHING and only show setup
  if (isInitialized === false) {
    return (
      <ThemeProvider>
        <Router>
          <div className="min-h-screen font-sans">
            <Routes>
              <Route path="/setup" element={<SystemSetup />} />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans selection:bg-cyan-500/30 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/register-student" element={<AdminStudentRegister />} />
            <Route path="/register" element={<AdminRegister />} />
            {/* Redirect /setup to dashboard if already initialized */}
            <Route path="/setup" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
