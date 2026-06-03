import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

// Placeholder for Attendance Logs
function AttendanceLogs() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Attendance Logs</h3>
      <p className="text-slate-500 dark:text-zinc-400">Your detailed attendance history will appear here.</p>
    </div>
  );
}

// Placeholder for Leave Requests
function LeaveRequests() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Leave Requests</h3>
      <p className="text-slate-500 dark:text-zinc-400">Submit and track your leave requests here.</p>
    </div>
  );
}

// Student Profile Component
function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Editable fields
  const [formData, setFormData] = useState({
    email: "",
    section: "",
    address: "",
    emergency_contact: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/student/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFormData({
        email: res.data.email || "",
        section: res.data.section || "",
        address: res.data.address || "",
        emergency_contact: res.data.emergency_contact || ""
      });
    } catch (err) {
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/student/profile", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Profile updated successfully!");
      fetchProfile(); // refresh
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-cyan-500 p-8">Loading profile...</div>;
  if (!profile) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Profile</h3>
      
      {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-500/20">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/20">{success}</div>}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Read-Only Section */}
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">Academic & Identity Information (Read-Only)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Full Name</label>
              <input type="text" value={profile.full_name || ""} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Roll / Registration Number</label>
              <input type="text" value={profile.roll_number || profile.registration_number || "N/A"} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Contact Number</label>
              <input type="text" value={profile.contact_number || ""} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Branch / Course</label>
              <input type="text" value={profile.branch || ""} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Face ID Status</label>
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed flex items-center gap-2">
                {profile.face_registered ? (
                  <><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Registered</>
                ) : (
                  <><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Not Registered</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Section */}
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">Additional Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Section</label>
              <input type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Emergency Contact Number</label>
              <input type="text" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Residential Address</label>
              <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button disabled={saving} type="submit" className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50">
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  if (!user) return <div className="h-screen flex items-center justify-center text-cyan-500">Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-colors"></div>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-2 transition-colors">Overall Attendance</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter transition-colors">85<span className="text-3xl text-slate-400 dark:text-zinc-500">%</span></h3>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1.5 flex items-center transition-colors">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    2% this week
                  </span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors"></div>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-2 transition-colors">Classes Attended</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter transition-colors">142</h3>
                  <span className="text-slate-400 dark:text-zinc-500 text-lg font-medium mb-1.5 transition-colors">/ 165</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden transition-colors">
                 <p className="text-slate-500 dark:text-zinc-400 font-medium mb-2 transition-colors">Face ID Status</p>
                 <div className="mt-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-medium text-lg transition-colors">Registered</h4>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 transition-colors">Ready for scanning</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative z-10 transition-colors">
              <div className="px-8 py-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                <h4 className="font-bold text-xl text-slate-900 dark:text-white transition-colors">Recent Attendance Logs</h4>
                <button onClick={() => setActiveTab('attendance')} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors">View All History</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/50 transition-colors">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 transition-colors">
                        <svg className="w-6 h-6 text-slate-400 dark:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <h5 className="text-slate-900 dark:text-white font-medium text-lg transition-colors">Machine Learning (CS401)</h5>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 transition-colors">Dr. Alan Turing • Room 302</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-1 transition-colors">
                        Present
                      </span>
                      <p className="text-sm text-slate-500 dark:text-zinc-500 block transition-colors">Today at 10:15 AM</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case "attendance":
        return <AttendanceLogs />;
      case "leave":
        return <LeaveRequests />;
      case "profile":
        return <StudentProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-6 flex flex-col gap-8 relative z-20 shadow-2xl transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Student<span className="text-cyan-500">.</span></h1>
        </div>
        
        <div className="flex flex-col gap-2">
          <div 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'overview' ? 'bg-cyan-50 dark:bg-zinc-800/50 text-cyan-600 dark:text-white border border-cyan-100 dark:border-zinc-700/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30 border border-transparent'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Overview
          </div>
          <div 
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'attendance' ? 'bg-cyan-50 dark:bg-zinc-800/50 text-cyan-600 dark:text-white border border-cyan-100 dark:border-zinc-700/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30 border border-transparent'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Attendance Logs
          </div>
          <div 
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'leave' ? 'bg-cyan-50 dark:bg-zinc-800/50 text-cyan-600 dark:text-white border border-cyan-100 dark:border-zinc-700/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30 border border-transparent'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Leave Requests
          </div>
          <div 
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'profile' ? 'bg-cyan-50 dark:bg-zinc-800/50 text-cyan-600 dark:text-white border border-cyan-100 dark:border-zinc-700/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30 border border-transparent'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </div>
        </div>

        <div className="mt-auto">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full px-4 py-3 rounded-xl text-red-500 dark:text-red-400 font-medium hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-3 border border-transparent hover:border-red-200 dark:hover:border-red-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -mt-40 -mr-40"></div>
        
        <header className="flex justify-between items-end mb-12 relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
              {activeTab === 'overview' && `Welcome back, ${user.name.split(' ')[0]}`}
              {activeTab === 'attendance' && 'Attendance Logs'}
              {activeTab === 'leave' && 'Leave Requests'}
              {activeTab === 'profile' && 'My Profile'}
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-lg transition-colors">
              {activeTab === 'overview' && "Here's your academic attendance overview."}
              {activeTab === 'attendance' && "View your detailed daily attendance records."}
              {activeTab === 'leave' && "Manage your leave of absence requests."}
              {activeTab === 'profile' && "View and update your personal details."}
            </p>
          </div>
          <div className="flex gap-4 items-center">
             <ThemeToggle />
             <div onClick={() => setActiveTab('profile')} className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border-2 border-cyan-500/30 overflow-hidden transition-colors cursor-pointer hover:border-cyan-500/60 shadow-lg">
               <img src={`https://ui-avatars.com/api/?name=${user.name}&background=06b6d4&color=fff`} alt="avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
