import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import PasswordStrength, { validatePassword } from "../components/PasswordStrength";

// Country codes (reused from registration form)
const COUNTRY_CODES = [
  { code: "+91",  country: "India (IN)",         digits: 10 },
  { code: "+1",   country: "USA/Canada (US/CA)",  digits: 10 },
  { code: "+44",  country: "UK (GB)",             digits: 10 },
  { code: "+61",  country: "Australia (AU)",      digits: 9  },
  { code: "+81",  country: "Japan (JP)",          digits: 10 },
  { code: "+86",  country: "China (CN)",          digits: 11 },
  { code: "+49",  country: "Germany (DE)",        digits: 10 },
  { code: "+33",  country: "France (FR)",         digits: 9  },
  { code: "+971", country: "UAE (AE)",            digits: 9  },
  { code: "+65",  country: "Singapore (SG)",      digits: 8  },
  { code: "+92",  country: "Pakistan (PK)",       digits: 10 },
  { code: "+880", country: "Bangladesh (BD)",     digits: 10 },
  { code: "+977", country: "Nepal (NP)",          digits: 10 },
  { code: "+62",  country: "Indonesia (ID)",      digits: 10 },
];

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "students",
    label: "Students",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "System Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "My Profile",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ─── Toggle Switch Component ────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
      <div>
        <p className="font-medium text-slate-800 dark:text-zinc-200 text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-zinc-700"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Overview stats
  const [stats, setStats] = useState({ present: 0, totalStudents: 0, pendingLeaves: 0 });

  // Students tab
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", branch: "", year: "", section: "" });

  // Analytics tab
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Profile tab
  const [profileData, setProfileData] = useState({ full_name: "", email: "", contact_number: "" });
  const [profileCountryCode, setProfileCountryCode] = useState("+91");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePhoneError, setProfilePhoneError] = useState("");
  const [profilePwdCurrent, setProfilePwdCurrent] = useState("");
  const [profilePwdNew, setProfilePwdNew] = useState("");
  const [profilePwdConfirm, setProfilePwdConfirm] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileMeta, setProfileMeta] = useState(null); // role, department, adminId

  // Settings tab
  const [settings, setSettings] = useState({
    strictAntiSpoofing: true,
    emailNotifications: false,
    maintenanceMode: false,
    autoExport: false,
    liveMonitoring: true,
  });

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { navigate("/login"); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role === "student") { navigate("/dashboard/student"); return; }
    setUser(parsed);

    // Fetch overview stats
    axios.get("http://localhost:8000/api/analytics/dashboard-stats", authHeader)
      .then((res) => setStats({ present: res.data.present_today, totalStudents: res.data.total_students, pendingLeaves: res.data.pending_leaves }))
      .catch(() => {
        axios.get("http://localhost:8000/api/admin/students", authHeader)
          .then((res) => setStats(prev => ({ ...prev, totalStudents: res.data.total })))
          .catch(console.error);
      });
  }, [navigate]);

  // ── Fetch Profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "profile") return;
    setProfileLoading(true);
    axios.get("http://localhost:8000/api/admin/profile", authHeader)
      .then(res => {
        const d = res.data;
        setProfileMeta(d);
        setProfileData({ full_name: d.full_name || "", email: d.email || "", contact_number: d.contact_number || "" });
        // Try to parse country code from stored contact number
        const stored = d.contact_number || "";
        const found = COUNTRY_CODES.find(c => stored.startsWith(c.code));
        if (found) {
          setProfileCountryCode(found.code);
          setProfilePhone(stored.slice(found.code.length));
        } else {
          setProfileCountryCode("+91");
          setProfilePhone(stored);
        }
      })
      .catch(err => setProfileError(err.response?.data?.detail || "Failed to load profile"))
      .finally(() => setProfileLoading(false));
  }, [activeTab]);

  // ── Fetch Students ──────────────────────────────────────────────────────────
  const fetchStudents = useCallback(() => {
    setStudentsLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.branch) params.append("branch", filters.branch);
    if (filters.year) params.append("year", filters.year);
    if (filters.section) params.append("section", filters.section);
    axios.get(`http://localhost:8000/api/admin/students?${params}`, authHeader)
      .then((res) => setStudents(res.data.items || []))
      .catch(console.error)
      .finally(() => setStudentsLoading(false));
  }, [filters]);

  useEffect(() => { if (activeTab === "students") fetchStudents(); }, [activeTab, fetchStudents]);

  // ── Fetch Analytics ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "analytics") return;
    setAnalyticsLoading(true);
    axios.get("http://localhost:8000/api/analytics/dashboard-stats", authHeader)
      .then((res) => setAnalyticsData(res.data))
      .catch(console.error)
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab]);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/admin/export-attendance", {
        ...authHeader,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `attendance_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Export failed: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!user) return <div className="h-screen flex items-center justify-center text-blue-500 text-lg font-medium">Loading...</div>;

  // ── Tab Header Labels ───────────────────────────────────────────────────────
  const tabTitles = {
    overview:  { title: "Admin Dashboard",   sub: "System overview and quick stats." },
    students:  { title: "Students",           sub: "View and filter all registered students." },
    analytics: { title: "Analytics",         sub: "Weekly attendance trends and department breakdown." },
    settings:  { title: "System Settings",   sub: "Configure system behaviour and notifications." },
    profile:   { title: "My Profile",        sub: "View and update your admin account credentials." },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-6 flex flex-col gap-8 relative z-20 shadow-2xl transition-colors duration-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin<span className="text-blue-500">.</span></h1>
        </div>

        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all text-left ${
                activeTab === item.id
                  ? "bg-blue-50 dark:bg-zinc-800/50 text-blue-600 dark:text-white border border-blue-100 dark:border-zinc-700/50"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
              }`}
            >
              <span className={activeTab === item.id ? "text-blue-500" : ""}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <a
            href="/dashboard/admin/register-student"
            className="w-full px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all text-left text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register Student
          </a>
        </nav>

        <div className="mt-auto">
          <div className="mb-4 px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50">
            <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.full_name || user?.email || "Admin"}</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="w-full px-4 py-3 rounded-xl text-red-500 dark:text-red-400 font-medium hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-3 border border-transparent hover:border-red-200 dark:hover:border-red-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -mt-40 -mr-40" />

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 relative z-10">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{tabTitles[activeTab].title}</h2>
            <p className="text-slate-500 dark:text-zinc-400">{tabTitles[activeTab].sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleExport}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Today's Report
            </button>
          </div>
        </header>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="relative z-10 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-1 text-sm">Total Students</p>
                <h3 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter">{stats.totalStudents}</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-1 text-sm">Present Today</p>
                <h3 className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter">{stats.present}</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-1 text-sm">Pending Leaves</p>
                <h3 className="text-5xl font-bold text-amber-500 dark:text-amber-400 tracking-tighter">{stats.pendingLeaves}</h3>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg mb-5">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Register Student", icon: "👤", color: "blue", action: () => window.location.href = "/dashboard/admin/register-student" },
                  { label: "View Students", icon: "📋", color: "indigo", action: () => setActiveTab("students") },
                  { label: "Analytics", icon: "📊", color: "purple", action: () => setActiveTab("analytics") },
                  { label: "Export CSV", icon: "📥", color: "emerald", action: handleExport },
                ].map((q) => (
                  <button key={q.label} onClick={q.action} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all group">
                    <span className="text-2xl">{q.icon}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 text-center">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg mb-4">System Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "Face Recognition Engine", status: "Online", color: "emerald" },
                  { name: "Anti-Spoofing Module", status: "Active", color: "blue" },
                  { name: "Database Connection", status: "Healthy", color: "emerald" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                    <span className="text-sm text-slate-700 dark:text-zinc-300 font-medium">{s.name}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-bold text-${s.color}-600 dark:text-${s.color}-400`}>
                      <span className={`w-2 h-2 rounded-full bg-${s.color}-500 animate-pulse`} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ STUDENTS TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "students" && (
          <div className="relative z-10 space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search by name, ID or email…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="flex-1 min-w-[180px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                type="text"
                placeholder="Branch (e.g. CS)"
                value={filters.branch}
                onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
                className="w-36 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                type="number"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                className="w-24 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                type="text"
                placeholder="Section"
                value={filters.section}
                onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
                className="w-28 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <button
                onClick={fetchStudents}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => { setFilters({ search: "", branch: "", year: "", section: "" }); }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-semibold transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
                <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Registered Students</h4>
                <span className="text-sm text-slate-500 dark:text-zinc-400">{students.length} records</span>
              </div>
              {studentsLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 dark:text-zinc-500 text-sm">Loading students…</div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 dark:text-zinc-500">
                  <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                  <p className="text-sm font-medium">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                        <th className="px-6 py-3 font-semibold">Name</th>
                        <th className="px-6 py-3 font-semibold">Student ID</th>
                        <th className="px-6 py-3 font-semibold">Email</th>
                        <th className="px-6 py-3 font-semibold">Branch</th>
                        <th className="px-6 py-3 font-semibold">Year</th>
                        <th className="px-6 py-3 font-semibold">Section</th>
                        <th className="px-6 py-3 font-semibold">Face</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">{s.full_name}</td>
                          <td className="px-6 py-3.5 font-mono text-blue-600 dark:text-blue-400 text-xs">{s.roll_number}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-zinc-400">{s.email}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-zinc-400">{s.branch || "—"}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-zinc-400">{s.year || "—"}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-zinc-400">{s.section || "—"}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.has_face_registered ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.has_face_registered ? "bg-emerald-500" : "bg-red-400"}`} />
                              {s.has_face_registered ? "Registered" : "Missing"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"}`}>
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ANALYTICS TAB ════════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div className="relative z-10 space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-zinc-500">Loading analytics…</div>
            ) : analyticsData ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { label: "Total Students", value: analyticsData.total_students, color: "blue" },
                    { label: "Present Today", value: analyticsData.present_today, color: "emerald" },
                    { label: "Pending Leaves", value: analyticsData.pending_leaves, color: "amber" },
                    { label: "Departments", value: analyticsData.department_breakdown?.length ?? 0, color: "purple" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
                      <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium mb-2 uppercase tracking-wider">{card.label}</p>
                      <p className={`text-4xl font-bold tracking-tighter text-${card.color}-600 dark:text-${card.color}-400`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Weekly trend */}
                {analyticsData.weekly_trend && analyticsData.weekly_trend.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-lg mb-6">7-Day Attendance Trend</h4>
                    <div className="flex items-end gap-3 h-36">
                      {(() => {
                        const maxVal = Math.max(...analyticsData.weekly_trend.map((d) => d.present), 1);
                        return analyticsData.weekly_trend.map((day) => (
                          <div key={day.date} className="flex flex-col items-center gap-2 flex-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{day.present}</span>
                            <div
                              className="w-full rounded-t-lg bg-blue-500 dark:bg-blue-600 transition-all hover:bg-blue-400"
                              style={{ height: `${Math.max((day.present / maxVal) * 100, 4)}%` }}
                              title={`${day.date}: ${day.present} present`}
                            />
                            <span className="text-[10px] text-slate-400 dark:text-zinc-600">{day.date}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Department breakdown */}
                {analyticsData.department_breakdown && analyticsData.department_breakdown.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-lg mb-5">Students by Department</h4>
                    <div className="space-y-3">
                      {analyticsData.department_breakdown.map((d) => {
                        const maxStudents = Math.max(...analyticsData.department_breakdown.map((x) => x.students), 1);
                        const pct = Math.round((d.students / maxStudents) * 100);
                        return (
                          <div key={d.department} className="flex items-center gap-4">
                            <span className="w-32 text-sm text-slate-700 dark:text-zinc-300 font-medium shrink-0 truncate">{d.department || "Unassigned"}</span>
                            <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-sm font-bold text-slate-900 dark:text-white shrink-0">{d.students}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-zinc-500 text-sm">No analytics data available.</div>
            )}
          </div>
        )}

        {/* ══ SETTINGS TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1">Security Settings</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Control face recognition and security behaviour.</p>
              <ToggleSwitch label="Strict Anti-Spoofing Mode" description="Block photo/video-based spoofing attempts with enhanced checks." enabled={settings.strictAntiSpoofing} onChange={(v) => setSettings((s) => ({ ...s, strictAntiSpoofing: v }))} />
              <ToggleSwitch label="Live Monitoring" description="Enable continuous background attendance monitoring." enabled={settings.liveMonitoring} onChange={(v) => setSettings((s) => ({ ...s, liveMonitoring: v }))} />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1">Notification Settings</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Configure how the system communicates events.</p>
              <ToggleSwitch label="Email Notifications" description="Send daily attendance summaries and alerts by email." enabled={settings.emailNotifications} onChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v }))} />
              <ToggleSwitch label="Auto-Export Daily Reports" description="Automatically export a CSV report at end of each school day." enabled={settings.autoExport} onChange={(v) => setSettings((s) => ({ ...s, autoExport: v }))} />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1">Maintenance</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Advanced system control options.</p>
              <ToggleSwitch label="Maintenance Mode" description="Temporarily disable student login for system updates." enabled={settings.maintenanceMode} onChange={(v) => setSettings((s) => ({ ...s, maintenanceMode: v }))} />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-400">
              ⚠️ These settings are UI placeholders for future backend integration.
            </div>
          </div>
        )}
        {/* ══ PROFILE TAB ══════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="relative z-10 max-w-2xl space-y-6">
            {profileLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-zinc-500">Loading profile…</div>
            ) : (
              <>
                {/* Info card */}
                {profileMeta && (
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                        {profileData.full_name?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profileData.full_name}</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">{profileMeta.role || "Admin"} {profileMeta.department ? `· ${profileMeta.department}` : ""}</p>
                        <p className="text-xs font-mono text-blue-500 dark:text-blue-400 mt-0.5">ID: {profileMeta.admin_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-slate-400 dark:text-zinc-500 text-xs mb-0.5">Email</p>
                        <p className="text-slate-800 dark:text-zinc-200 font-medium truncate">{profileData.email}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-slate-400 dark:text-zinc-500 text-xs mb-0.5">Contact</p>
                        <p className="text-slate-800 dark:text-zinc-200 font-medium">{profileData.contact_number || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit form */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1">Edit Profile</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 mb-5">Update your name, email, and contact number.</p>

                  {profileSuccess && (
                    <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm p-3 rounded-xl font-medium">
                      ✓ {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl font-medium">
                      {profileError}
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setProfileSuccess("");
                      setProfileError("");

                      // Validate phone if changed
                      if (profilePhone) {
                        const country = COUNTRY_CODES.find(c => c.code === profileCountryCode);
                        const digits = profilePhone.replace(/\D/g, "");
                        if (country && digits.length !== country.digits) {
                          setProfilePhoneError(`${country.country} requires exactly ${country.digits} digits (you entered ${digits.length})`);
                          return;
                        }
                      }

                      // Password validation
                      if (profilePwdNew) {
                        if (!profilePwdCurrent) { setProfileError("Enter your current password to set a new one."); return; }
                        const pwdErr = validatePassword(profilePwdNew);
                        if (pwdErr) { setProfileError(pwdErr); return; }
                        if (profilePwdNew !== profilePwdConfirm) { setProfileError("New passwords do not match."); return; }
                      }

                      const payload = {
                        full_name: profileData.full_name,
                        email: profileData.email,
                        contact_number: profilePhone ? profileCountryCode + profilePhone.replace(/\D/g, "") : profileData.contact_number,
                      };
                      if (profilePwdNew) {
                        payload.current_password = profilePwdCurrent;
                        payload.new_password = profilePwdNew;
                      }

                      setProfileLoading(true);
                      try {
                        const res = await axios.put("http://localhost:8000/api/admin/profile", payload, authHeader);
                        setProfileSuccess(res.data.message || "Profile updated successfully!");
                        setProfilePwdCurrent(""); setProfilePwdNew(""); setProfilePwdConfirm("");
                        // Update local user display name
                        const stored = JSON.parse(localStorage.getItem("user") || "{}");
                        localStorage.setItem("user", JSON.stringify({ ...stored, name: res.data.full_name }));
                      } catch (err) {
                        setProfileError(err.response?.data?.detail || "Update failed.");
                      } finally {
                        setProfileLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={e => setProfileData(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Contact Number</label>
                      <div className="flex gap-2">
                        <select
                          value={profileCountryCode}
                          onChange={e => { setProfileCountryCode(e.target.value); setProfilePhoneError(""); }}
                          className="w-44 shrink-0 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.code} — {c.country}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={e => { setProfilePhone(e.target.value); setProfilePhoneError(""); }}
                          placeholder={`${COUNTRY_CODES.find(c => c.code === profileCountryCode)?.digits || 10} digits`}
                          className={`flex-1 bg-slate-50 dark:bg-zinc-950 border rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 transition-all ${
                            profilePhoneError ? "border-red-400 focus:ring-red-500/50" : "border-slate-300 dark:border-zinc-800 focus:ring-blue-500/50 focus:border-blue-500"
                          }`}
                        />
                      </div>
                      {profilePhoneError && <p className="mt-1 text-xs text-red-500">{profilePhoneError}</p>}
                      {!profilePhoneError && profilePhone && <p className="mt-1 text-xs text-emerald-500">✓ Full: {profileCountryCode}{profilePhone.replace(/\D/g, "")}</p>}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                      <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3">Change Password <span className="text-slate-400 dark:text-zinc-500 font-normal">(optional)</span></h5>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current password"
                          value={profilePwdCurrent}
                          onChange={e => setProfilePwdCurrent(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                        />
                        <div>
                          <input
                            type="password"
                            placeholder="New password (min 8 chars, A-z, 0-9, !@#…)"
                            value={profilePwdNew}
                            onChange={e => setProfilePwdNew(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                          />
                          <PasswordStrength password={profilePwdNew} />
                        </div>
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          value={profilePwdConfirm}
                          onChange={e => setProfilePwdConfirm(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl px-8 py-2.5 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
                      >
                        {profileLoading ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
