import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import PasswordStrength, { validatePassword } from '../components/PasswordStrength';

const COUNTRY_CODES = [
  { code: '+91',  country: 'India (IN)',           digits: 10 },
  { code: '+1',   country: 'USA/Canada (US/CA)',   digits: 10 },
  { code: '+44',  country: 'UK (GB)',              digits: 10 },
  { code: '+61',  country: 'Australia (AU)',       digits: 9  },
  { code: '+81',  country: 'Japan (JP)',           digits: 10 },
  { code: '+86',  country: 'China (CN)',           digits: 11 },
  { code: '+49',  country: 'Germany (DE)',         digits: 10 },
  { code: '+33',  country: 'France (FR)',          digits: 9  },
  { code: '+39',  country: 'Italy (IT)',           digits: 10 },
  { code: '+7',   country: 'Russia (RU)',          digits: 10 },
  { code: '+55',  country: 'Brazil (BR)',          digits: 11 },
  { code: '+27',  country: 'South Africa (ZA)',    digits: 9  },
  { code: '+971', country: 'UAE (AE)',             digits: 9  },
  { code: '+65',  country: 'Singapore (SG)',       digits: 8  },
  { code: '+60',  country: 'Malaysia (MY)',        digits: 9  },
  { code: '+92',  country: 'Pakistan (PK)',        digits: 10 },
  { code: '+880', country: 'Bangladesh (BD)',      digits: 10 },
  { code: '+94',  country: 'Sri Lanka (LK)',       digits: 9  },
  { code: '+977', country: 'Nepal (NP)',           digits: 10 },
  { code: '+62',  country: 'Indonesia (ID)',       digits: 10 },
];

export default function AdminRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Camera States
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // OTP States
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    admin_id: '',
    email: '',
    contact_number: '',
    role_id: '',
    department_id: '',
    password: '',
    password: '',
    confirm_password: ''
  });

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

  const validatePhone = (code, number) => {
    const country = COUNTRY_CODES.find(c => c.code === code);
    if (!country) return 'Please select a valid country code.';
    const digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.length === 0) return 'Phone number is required.';
    if (digitsOnly.length !== country.digits)
      return `${country.country} numbers must be exactly ${country.digits} digits (you entered ${digitsOnly.length}).`;
    return '';
  };

  const handlePhoneChange = (code, number) => {
    setPhoneNumber(number);
    const err = validatePhone(code, number);
    setPhoneError(err);
    setFormData(prev => ({ ...prev, contact_number: code + number.replace(/\D/g, '') }));
  };

  const handleCountryCodeChange = (code) => {
    setCountryCode(code);
    if (phoneNumber) {
      const err = validatePhone(code, phoneNumber);
      setPhoneError(err);
      setFormData(prev => ({ ...prev, contact_number: code + phoneNumber.replace(/\D/g, '') }));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(countryCode, phoneNumber);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) { setError(pwdErr); return; }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (!image) {
      setError("Please capture a face image first.");
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("admin_id", formData.admin_id);
    data.append("email", formData.email);
    data.append("contact_number", formData.contact_number);
    data.append("role_id", formData.role_id);
    if (formData.department_id) data.append("department_id", formData.department_id);
    data.append("password", formData.password);
    data.append("file", image, "face.jpg");

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/register/admin', data);
      if (res.data.requires_otp) {
        stopCamera();
        setOtpStep(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("admin_id", formData.admin_id);
    data.append("email", formData.email);
    data.append("contact_number", formData.contact_number);
    data.append("role_id", formData.role_id);
    if (formData.department_id) data.append("department_id", formData.department_id);
    data.append("password", formData.password);
    data.append("otp_code", otpCode);
    data.append("file", image, "face.jpg");

    try {
      await axios.post('http://127.0.0.1:8000/api/auth/register/admin/verify', data);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (otpStep) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center relative bg-slate-50 dark:bg-zinc-950">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verify Access</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
            An access code has been sent to the Super Admin. Please enter the 6-digit code below to approve your registration.
          </p>

          <form onSubmit={handleVerifyOTP}>
            {error && <div className="mb-6 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg">{error}</div>}
            
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              maxLength="6"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl tracking-[1em] font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-8"
            />
            
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setOtpStep(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium transition-colors"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center relative overflow-y-auto bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="absolute top-4 left-4 z-50">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </a>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10 transition-colors">
        <div className="mb-8 border-b border-slate-200 dark:border-zinc-800 pb-6 transition-colors">
          <Link to="/register" className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center text-sm font-medium transition-colors mb-6 inline-flex">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Selection
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Admin Registration</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Create a faculty or administrative account.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-lg text-center font-medium transition-colors">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form id="admin-reg-form" onSubmit={handleRequestAccess} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Full Name</label>
                  <input required type="text" name="full_name" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Admin ID</label>
                  <input required type="text" name="admin_id" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Email Address</label>
                  <input required type="email" name="email" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Contact Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={e => handleCountryCodeChange(e.target.value)}
                      className="w-44 shrink-0 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.country}</option>
                      ))}
                    </select>
                    <input
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={e => handlePhoneChange(countryCode, e.target.value)}
                      className={`flex-1 min-w-0 bg-slate-50 dark:bg-zinc-950 border rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 ${
                        phoneError
                          ? 'border-red-400 focus:ring-red-500/50 focus:border-red-400'
                          : 'border-slate-300 dark:border-zinc-800 focus:ring-blue-500/50 focus:border-blue-500'
                      }`}
                      placeholder={`${COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 10} digits`}
                      maxLength={COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 15}
                    />
                  </div>
                  {phoneError && <p className="mt-1 text-xs text-red-500 font-medium">{phoneError}</p>}
                  {!phoneError && phoneNumber && (
                    <p className="mt-1 text-xs text-emerald-500 font-medium">✓ Full: {countryCode}{phoneNumber.replace(/\D/g, '')}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Admin Role</label>
                  <select required name="role_id" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all">
                    <option value="">Select Role</option>
                    <option value="faculty">Faculty Admin</option>
                    <option value="department">Department Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Department (Optional)</label>
                  <input type="text" name="department_id" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-zinc-800 transition-colors">
                  <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      name="password"
                      onChange={(e) => { handleChange(e); setPassword(e.target.value); }}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 transition-colors">Confirm Password</label>
                  <div className="relative">
                    <input required type={showConfirmPassword ? "text" : "password"} name="confirm_password" onChange={handleChange} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Camera Section */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="Captured face" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  {!videoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-zinc-500">
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
                  <button type="button" onClick={startCamera} className="flex-1 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg transition-colors text-sm font-medium">
                    Start Camera
                  </button>
                  <button type="button" onClick={captureFace} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                    Capture Face
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { setImageUrl(null); setImage(null); startCamera(); }} className="w-full bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg transition-colors text-sm font-medium">
                  Retake Photo
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 text-center">
              Make sure your face is clearly visible and well-lit.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex justify-end transition-colors mt-8">
          <button 
            type="submit" 
            form="admin-reg-form"
            disabled={isLoading || !image}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending Request...
              </>
            ) : (
              'Request Admin Access'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
