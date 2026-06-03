import React, { useRef, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

// Country codes with expected digit lengths (excluding country code)
const COUNTRY_CODES = [
  { code: "+91",  country: "India (IN)",          digits: 10 },
  { code: "+1",   country: "USA/Canada (US/CA)",   digits: 10 },
  { code: "+44",  country: "UK (GB)",              digits: 10 },
  { code: "+61",  country: "Australia (AU)",       digits: 9  },
  { code: "+81",  country: "Japan (JP)",           digits: 10 },
  { code: "+86",  country: "China (CN)",           digits: 11 },
  { code: "+49",  country: "Germany (DE)",         digits: 10 },
  { code: "+33",  country: "France (FR)",          digits: 9  },
  { code: "+39",  country: "Italy (IT)",           digits: 10 },
  { code: "+7",   country: "Russia (RU)",          digits: 10 },
  { code: "+55",  country: "Brazil (BR)",          digits: 11 },
  { code: "+27",  country: "South Africa (ZA)",    digits: 9  },
  { code: "+971", country: "UAE (AE)",             digits: 9  },
  { code: "+65",  country: "Singapore (SG)",       digits: 8  },
  { code: "+60",  country: "Malaysia (MY)",        digits: 9  },
  { code: "+92",  country: "Pakistan (PK)",        digits: 10 },
  { code: "+880", country: "Bangladesh (BD)",      digits: 10 },
  { code: "+94",  country: "Sri Lanka (LK)",       digits: 9  },
  { code: "+977", country: "Nepal (NP)",           digits: 10 },
  { code: "+62",  country: "Indonesia (ID)",       digits: 10 },
];

export default function AdminStudentRegister() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [formData, setFormData] = useState({ 
    full_name: "", 
    email: "", 
    contact_number: "", 
    branch: "", 
    year: "", 
    section: "" 
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);

    // Stop any existing stream tracks before re-starting
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Try with ideal constraints first, fall back to minimal
    const tryStart = async (constraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    try {
      await tryStart({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } });
    } catch (err) {
      console.warn("Ideal constraints failed, trying minimal:", err.name, err.message);
      try {
        await tryStart({ video: true });
      } catch (err2) {
        console.error("Camera error:", err2.name, err2.message);
        if (err2.name === "NotAllowedError" || err2.name === "PermissionDeniedError") {
          setError("camera_denied");
        } else if (err2.name === "NotFoundError" || err2.name === "DevicesNotFoundError") {
          setError("No camera device found. Please connect a webcam and try again.");
        } else if (err2.name === "NotReadableError" || err2.name === "TrackStartError") {
          setError("camera_inuse");
        } else if (err2.name === "OverconstrainedError") {
          setError("Your camera does not support the required video format. Try a different browser.");
        } else {
          setError("Could not start camera: " + err2.message + " (" + err2.name + ")");
        }
      }
    }
  };

  const validatePhone = (code, number) => {
    const country = COUNTRY_CODES.find(c => c.code === code);
    if (!country) return "Please select a valid country code.";
    const digitsOnly = number.replace(/\D/g, "");
    if (digitsOnly.length === 0) return "Phone number is required.";
    if (digitsOnly.length !== country.digits)
      return `${country.country} numbers must be exactly ${country.digits} digits (you entered ${digitsOnly.length}).`;
    return "";
  };

  const handlePhoneChange = (code, number) => {
    setPhoneNumber(number);
    const err = validatePhone(code, number);
    setPhoneError(err);
    setFormData(prev => ({ ...prev, contact_number: code + number.replace(/\D/g, "") }));
  };

  const handleCountryCodeChange = (code) => {
    setCountryCode(code);
    if (phoneNumber) {
      const err = validatePhone(code, phoneNumber);
      setPhoneError(err);
      setFormData(prev => ({ ...prev, contact_number: code + phoneNumber.replace(/\D/g, "") }));
    }
  };

  const captureFace = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      canvasRef.current.toBlob((blob) => {
        setImage(blob);
        setImageUrl(URL.createObjectURL(blob));
      }, "image/jpeg");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate phone
    const phoneErr = validatePhone(countryCode, phoneNumber);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    if (!image) {
      setError("Please capture a face image first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    setCredentials(null);

    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("email", formData.email);
    data.append("contact_number", formData.contact_number);
    if (formData.branch) data.append("branch", formData.branch);
    if (formData.year) data.append("year", formData.year);
    if (formData.section) data.append("section", formData.section);
    data.append("file", image, "face.jpg");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:8000/api/admin/register-student", data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Stop camera once registered
      stopCamera();
      
      setMessage("Success! Student registered.");
      setCredentials(res.data.credentials);
      setFormData({ full_name: "", email: "", contact_number: "", branch: "", year: "", section: "" });
      setPhoneNumber("");
      setPhoneError("");
      setImage(null);
      setImageUrl(null);
    } catch (err) {
      setError("Error: " + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <aside className="hidden md:flex w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-6 flex-col gap-8 shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin<span className="text-blue-500">.</span></h1>
        </div>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard/admin" className="px-4 py-3 rounded-xl text-slate-500 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/30 transition-colors flex items-center gap-3">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>
             Overview
          </Link>
          <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-zinc-800/50 text-blue-600 dark:text-white font-medium border border-blue-100 dark:border-zinc-700/50 flex items-center gap-3 transition-colors">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Register Student
          </div>
        </nav>
      </aside>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="absolute top-4 right-4 z-50">
           <ThemeToggle />
        </div>
        <header className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Register New Student</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400">Capture face data and create a new student profile.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl transition-colors">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Student Details</h3>
            
            {credentials && (
              <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-5 rounded-xl">
                 <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2">Student Credentials Generated!</h4>
                 <p className="text-sm text-emerald-700 dark:text-emerald-500 mb-1"><strong>Unique ID:</strong> <span className="font-mono bg-white dark:bg-black px-2 py-0.5 rounded">{credentials.unique_id}</span></p>
                 <p className="text-sm text-emerald-700 dark:text-emerald-500"><strong>Password:</strong> <span className="font-mono bg-white dark:bg-black px-2 py-0.5 rounded">{credentials.password}</span></p>
                 <p className="text-xs text-emerald-600 dark:text-emerald-600 mt-2">Please provide these to the student.</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Contact Number *</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={e => handleCountryCodeChange(e.target.value)}
                    className="w-44 shrink-0 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-3 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.country}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => handlePhoneChange(countryCode, e.target.value)}
                    className={`flex-1 bg-slate-50 dark:bg-zinc-950 border rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${
                      phoneError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-300 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder={`${COUNTRY_CODES.find(c=>c.code===countryCode)?.digits || 10} digits`}
                    maxLength={COUNTRY_CODES.find(c=>c.code===countryCode)?.digits || 15}
                  />
                </div>
                {phoneError && <p className="mt-1.5 text-xs text-red-500 font-medium">{phoneError}</p>}
                {!phoneError && phoneNumber && (
                  <p className="mt-1.5 text-xs text-emerald-500 font-medium">✓ Full number: {countryCode}{phoneNumber.replace(/\D/g, "")}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Branch</label>
                   <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="CS" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Year</label>
                   <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="2024" />
                 </div>
              </div>
              
              {error && error !== "camera_denied" && error !== "camera_inuse" && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{error}</p>}
              {message && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20">{message}</p>}
              
              <button disabled={loading} type="submit" className="mt-2 md:mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-colors shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50">
                {loading ? "Registering..." : "Register Student"}
              </button>
            </form>
          </div>

          {/* Camera */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col items-center transition-colors">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 self-start">Face Capture</h3>
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden mb-4 border border-slate-300 dark:border-zinc-700">
              <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${image ? 'hidden' : 'block'}`}></video>
              {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="Captured face" />}
              <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
              {!image && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-48 h-48 border-2 border-dashed border-blue-500/50 rounded-full opacity-50"></div>
              </div>}
            </div>

            {/* Camera denied help box */}
            {error === "camera_denied" && (
              <div className="w-full mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-sm">
                <p className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Camera Permission Denied
                </p>
                <p className="text-red-700 dark:text-red-300 mb-2 font-medium">To allow camera in Chrome / Edge:</p>
                <ol className="text-red-600 dark:text-red-400 space-y-1 list-decimal list-inside">
                  <li>Click the <strong>🔒 lock / camera icon</strong> in the address bar</li>
                  <li>Set <strong>Camera</strong> to <strong>Allow</strong></li>
                  <li>Reload the page, then click <strong>Start Camera</strong> again</li>
                </ol>
              </div>
            )}

            {/* Camera in use help box */}
            {error === "camera_inuse" && (
              <div className="w-full mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Camera Is Already In Use
                </p>
                <p className="text-amber-700 dark:text-amber-300 mb-2">Another app or browser tab is using your camera. To fix:</p>
                <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                  <li>Close <strong>Zoom, Teams, Meet, Skype</strong> or any video app</li>
                  <li>Close <strong>other browser tabs</strong> that may be using the camera</li>
                  <li>Click <strong>Start Camera</strong> again</li>
                </ol>
              </div>
            )}

            {error && error !== "camera_denied" && error !== "camera_inuse" && (
              <p className="w-full mb-4 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{error}</p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
              <button type="button" onClick={startCamera} className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-medium rounded-lg transition-colors border border-slate-200 dark:border-zinc-700">Start Camera</button>
              {!image ? (
                <button type="button" onClick={captureFace} className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-900/50">Capture Photo</button>
              ) : (
                <button type="button" onClick={(e) => { e.preventDefault(); setImage(null); setImageUrl(null); setError(null); }} className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-medium rounded-lg transition-colors border border-amber-200 dark:border-amber-800/50">Retake Photo</button>
              )}
            </div>
            
            {image && <p className="text-sm text-emerald-500 mt-4 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Photo captured successfully.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
