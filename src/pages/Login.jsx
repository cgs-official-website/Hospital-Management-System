import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, HeartPulse, ShieldCheck, Activity, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Modal from '../shared/components/Modal';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('role')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // --- DEVELOPMENT BYPASS ---
    // If the user types 'admin123' as password, we bypass Firebase Auth for testing purposes.
    if (formData.password === 'admin123') {
      let role = 'admin';
      const emailLower = formData.email.toLowerCase();
      if (emailLower.includes('superadmin')) role = 'superadmin';
      else if (emailLower.includes('nurse')) role = 'nurse';
      else if (emailLower.includes('pharma')) role = 'pharmacist';
      else if (emailLower.includes('recept')) role = 'receptionist';
      else if (emailLower.includes('doctor')) role = 'doctor';
      else if (emailLower.includes('staff')) role = 'staff';

      localStorage.setItem('userRole', role);
      localStorage.setItem('hospitalId', role === 'superadmin' ? 'zuna-hq' : 'test-hospital-id');
      localStorage.setItem('userName', 'Test User');
      
      setLoading(false);
      navigate('/dashboard');
      return;
    }
    // ---------------------------

    try {
      // Normal user login
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Fetch user role and hospital
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('hospitalId', userData.hospitalId);
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userName', userData.name || user.email);
        navigate('/dashboard');
      } else {
        setErrorMsg("User profile not found. Please contact support.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex w-full bg-surface overflow-hidden">
      
      {/* Left Side: Animated Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-gradient-to-br from-primary via-[#0275d8] to-accent text-white p-12 relative overflow-hidden flex-col justify-center items-center">
        
        {/* Animated Background Shapes */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-white opacity-5 rounded-[40%] blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-sky-200 opacity-10 rounded-[30%] blur-3xl"
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 opacity-20"
          >
            <HeartPulse size={64} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 30, 0] }} 
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/4 opacity-20"
          >
            <Stethoscope size={80} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-1/5 opacity-20"
          >
            <Activity size={48} />
          </motion.div>
        </div>

        {/* Brand Content */}
        <div className="relative z-10 max-w-lg text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 bg-white rounded-3xl p-4 mx-auto mb-8 shadow-2xl flex items-center justify-center"
          >
            <img src="/zuna-logo.png" alt="ZUNA" className="w-full h-full object-contain drop-shadow-md" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight leading-tight"
          >
            ZUNA Enterprise <br/> <span className="text-sky-200">Health System</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg text-sky-100 font-medium leading-relaxed"
          >
            The comprehensive clinic management software designed to streamline your hospital's operations, elevate patient care, and empower your staff.
          </motion.p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex items-center justify-center p-6 lg:p-12 relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 my-auto"
          >
            <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-sky-100">
              <ShieldCheck className="text-primary" size={32} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Please enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Work Email</label>
              <input 
                required 
                type="email" 
                name="email" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-700" 
                placeholder="name@hospital.com" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex justify-between items-center">
                Password
                <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot Password?</a>
              </label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"}
                  name="password" 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className={`w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-700 ${!showPassword ? 'tracking-widest' : ''}`} 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-sky-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock size={18} /> Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Secure access is strictly limited to authorized personnel. <br/> Protected by ZUNA Security.
            </p>
          </div>
        </motion.div>
        </div>
      </div>

      <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg('')} title="Authentication Failed">
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <Lock size={32} />
          </div>
          <p className="text-slate-700 font-medium text-lg">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl w-full mt-6 transition-colors">
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;
