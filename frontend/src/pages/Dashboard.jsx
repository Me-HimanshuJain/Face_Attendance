import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [successEvent, setSuccessEvent] = useState(null);
  const videoImgRef = useRef(null); // ref to the live feed <img>

  const playBeep = () => {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Setup SSE connection
    const eventSource = new EventSource("http://localhost:8000/api/video/events");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSuccessEvent(data);
        playBeep();
        
        setTimeout(() => {
          setSuccessEvent(null);
        }, 3000);
      } catch (err) {
        console.error("Error parsing event data", err);
      }
    };

    return () => {
      clearInterval(timer);
      eventSource.close();
    };
  }, []);

  // Stop the MJPEG stream when navigating away so the backend releases
  // cv2.VideoCapture(0) and the registration page can access the camera
  useEffect(() => {
    return () => {
      if (videoImgRef.current) {
        videoImgRef.current.src = ""; // kills the HTTP connection to /api/video/feed
      }
      // Explicitly tell the backend to stop the camera loop
      fetch("http://localhost:8000/api/video/stop_feed").catch(err => console.error("Error stopping feed:", err));
    };
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative font-sans transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center relative z-10 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/50 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">FaceID<span className="text-cyan-500 dark:text-cyan-400">.</span></h1>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 tracking-wide transition-colors">SMART ATTENDANCE KIOSK</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-wider font-mono transition-colors">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium transition-colors">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          
          <ThemeToggle />

          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Admin Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 flex gap-8 relative z-10">
        
        {/* Left Side: Live Feed */}
        <div className="flex-1 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative group transition-colors duration-300">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            <span className="text-sm font-bold text-white uppercase tracking-widest">Live</span>
          </div>
          
          <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
            <img 
              ref={videoImgRef}
              src="http://localhost:8000/api/video/feed" 
              className="w-full h-full object-cover opacity-95 transition-transform duration-1000 group-hover:scale-[1.02]" 
              alt="Live Security Feed" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback if camera is off */}
            <div className="absolute inset-0 hidden flex-col items-center justify-center text-zinc-500 gap-4">
              <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xl font-medium tracking-wide">Camera Feed Offline</p>
            </div>

            {/* Scan Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-cyan-500/30 rounded-3xl animate-[spin_15s_linear_infinite] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-dashed border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite_reverse] pointer-events-none"></div>
            
            {/* Success Overlay */}
            {successEvent && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-4 animate-[bounce_1s_ease-in-out_infinite]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-2xl font-bold tracking-wide uppercase">
                  {successEvent.role}: {successEvent.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Status Panel */}
        <aside className="w-96 flex flex-col gap-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl transition-colors duration-300">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-3 transition-colors">
              <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              System Status
            </h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-medium transition-colors">Camera</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 transition-colors">Video Feed</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 transition-colors">Active</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-medium transition-colors">Face Engine</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 transition-colors">Recognition</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 transition-colors">Online</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-medium transition-colors">Liveness</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 transition-colors">Anti-Spoofing</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 transition-colors">Secured</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center transition-colors duration-300">
             <div className="w-20 h-20 rounded-full bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center mb-4 transition-colors">
                <svg className="w-10 h-10 text-cyan-600 dark:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">Automated Attendance</h3>
             <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[250px] transition-colors">
               Please stand in front of the camera and look directly at the lens. Your attendance will be logged automatically.
             </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
