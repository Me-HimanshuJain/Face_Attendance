import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import PasswordStrength from '../components/PasswordStrength';

function SystemSetup() {
  const [formData, setFormData] = useState({
    full_name: '',
    admin_id: '',
    email: '',
    contact_number: '',
    password: '',
    confirm_password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

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
    setError('');
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not start camera: " + err.message);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match");
      return;
    }
    
    if (!image) {
      setError("Please capture a face image first.");
      return;
    }

    try {
      setIsLoading(true);
      const data = new FormData();
      data.append("full_name", formData.full_name);
      data.append("admin_id", formData.admin_id);
      data.append("email", formData.email);
      data.append("contact_number", formData.contact_number);
      data.append("password", formData.password);
      data.append("file", image, "face.jpg");

      await axios.post('http://localhost:8000/api/setup/initialize', data);
      
      // Stop camera before navigating
      stopCamera();
      
      // Force reload to bypass initialization lock
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.detail || 'Initialization failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-4xl relative z-10 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white mb-6 shadow-lg shadow-cyan-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">System Initialization</h1>
          <p className="text-zinc-400">Configure the primary Super Admin account to unlock the institution's attendance system.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Column */}
            <form id="setup-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                  <input required type="text" name="full_name" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Admin ID</label>
                  <input required type="text" name="admin_id" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
                  <input required type="email" name="email" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contact Number</label>
                  <input required type="tel" name="contact_number" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Master Password</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} name="password" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-400">
                      Show
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input required type={showConfirmPassword ? "text" : "password"} name="confirm_password" onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-400">
                      Show
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Camera Column */}
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Captured face" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    {!videoRef.current?.srcObject && (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                        Camera feed will appear here
                      </div>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              </div>

              <div className="flex gap-3">
                {!imageUrl ? (
                  <>
                    <button type="button" onClick={startCamera} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                      Start Camera
                    </button>
                    <button type="button" onClick={captureFace} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                      Capture Face
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setImageUrl(null); setImage(null); startCamera(); }} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                    Retake Photo
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Make sure your face is clearly visible and well-lit.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <button 
              type="submit" 
              form="setup-form"
              disabled={isLoading || !image}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? "Initializing System..." : "Initialize System"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSetup;
