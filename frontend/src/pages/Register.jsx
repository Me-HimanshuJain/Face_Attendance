import React, { useRef, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Register() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [formData, setFormData] = useState({ name: "", email: "", department: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const captureFace = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      canvasRef.current.toBlob((blob) => {
        setImage(blob);
      }, "image/jpeg");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setMessage("Please capture a face image first.");
    
    setLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("department", formData.department);
    data.append("file", image, "face.jpg");

    try {
      const res = await axios.post("http://localhost:8000/api/register", data);
      setMessage("Success! User registered.");
      setFormData({ name: "", email: "", department: "" });
      setImage(null);
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">FaceID<span className="text-cyan-500">.</span></h1>
        </div>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className="px-4 py-2.5 rounded-lg text-zinc-400 font-medium hover:text-zinc-200 hover:bg-zinc-800/30 transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <a href="/dashboard" className="px-4 py-2.5 rounded-lg text-zinc-400 font-medium hover:text-zinc-200 hover:bg-zinc-800/30 transition-colors flex items-center gap-3">Overview</a>
          <a href="/register" className="px-4 py-2.5 rounded-lg bg-zinc-800/50 text-cyan-400 font-medium border border-zinc-700/50 flex items-center gap-3 transition-colors hover:bg-zinc-800"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>Registration</a>
        </nav>
      </aside>
      
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Register New User</h2>
          <p className="text-zinc-400">Capture face data and create a new profile.</p>
        </header>

        <div className="grid grid-cols-2 gap-10">
          {/* Form */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6">User Details</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors" placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Department</label>
                <input type="text" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors" placeholder="Engineering" />
              </div>
              <button disabled={loading} type="submit" className="mt-4 w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-3.5 rounded-lg transition-colors shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50">
                {loading ? "Registering..." : "Register User"}
              </button>
              {message && <p className="text-sm font-medium text-center text-emerald-400 mt-2">{message}</p>}
            </form>
          </div>

          {/* Camera */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col items-center">
            <h3 className="text-xl font-semibold text-white mb-6 self-start">Face Capture</h3>
            <div className="relative aspect-video w-full bg-zinc-950 rounded-xl overflow-hidden mb-6 border border-zinc-800">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
              {!image && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-48 h-48 border-2 border-dashed border-cyan-500/50 rounded-full opacity-50"></div>
              </div>}
            </div>
            
            <div className="flex gap-4 w-full">
              <button onClick={startCamera} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700">Start Camera</button>
              <button onClick={captureFace} className="flex-1 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg transition-colors">Capture Photo</button>
            </div>
            
            {image && <p className="text-sm text-cyan-400 mt-4 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Photo captured successfully.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
