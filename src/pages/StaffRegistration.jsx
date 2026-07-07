import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { motion } from 'framer-motion';
import { UserPlus, Building2, User, Mail, Phone, Lock, ChevronRight, AlertCircle, CheckCircle2, Activity, HeartPulse, Stethoscope } from 'lucide-react';

const StaffRegistration = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registering, setRegistering] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'doctor', // Default role
    department: 'General'
  });

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const decodedName = decodeURIComponent(hospitalId);
        const q = query(collection(db, 'hospitals'), where('hospitalName', '==', decodedName));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          if (docSnap.data().status === 'active') {
            setHospitalInfo({ id: docSnap.id, ...docSnap.data() });
            document.title = `Join ${docSnap.data().hospitalName} - ZUNA`;
          } else {
            setError('This hospital workspace is inactive or does not exist.');
          }
        } else {
          setError('This hospital workspace does not exist.');
        }
      } catch (err) {
        console.error("Fetch hospital error: ", err);
        setError('Failed to load workspace details. ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHospital();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setError('');
    
    try {
      // 1. Create user in Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists.');
        } else {
          setError('Authentication error: ' + authError.message);
        }
        setRegistering(false);
        return;
      }
      
      const user = userCredential.user;

      // 2. Add to users collection under this hospitalId using the uid
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        hospitalId: hospitalInfo.id,
        status: 'active', // Admin can deactivate them later if needed
        createdAt: serverTimestamp()
      });

      // 3. Auto-login the user
      localStorage.setItem('userRole', formData.role);
      localStorage.setItem('hospitalId', hospitalInfo.id);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userName', formData.name);

      setSuccess('Account created successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full bg-surface overflow-hidden">
      
      {/* Left Side: Animated Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-400 text-white p-12 relative overflow-hidden flex-col justify-center items-center">
        
        {/* Animated Background Shapes */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-white opacity-10 rounded-[40%] blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 55, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-sky-200 opacity-20 rounded-[30%] blur-3xl"
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 opacity-20"
          >
            <UserPlus size={64} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 30, 0] }} 
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/4 opacity-20"
          >
            <HeartPulse size={80} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-1/5 opacity-20"
          >
            <Stethoscope size={48} />
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
            {hospitalInfo?.logoBase64 ? (
              <img src={hospitalInfo.logoBase64} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <img src="/zuna-logo.png" alt="ZUNA" className="w-full h-full object-contain drop-shadow-md" />
            )}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight leading-tight"
          >
            Join <br/> <span className="text-cyan-100">{hospitalInfo?.hospitalName || 'Zuna Workspace'}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg text-teal-100 font-medium leading-relaxed"
          >
            Create your staff account to securely access your hospital's internal workspace and collaborate with your team.
          </motion.p>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex items-center justify-center p-6 lg:p-12 relative">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-xl bg-white rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 my-auto"
          >
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                <UserPlus className="text-teal-600" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Registration</h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">Please enter your details to create your account.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 text-sm font-bold">
                <AlertCircle size={20} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 size={20} className="shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {!error && !success && (
              <form onSubmit={handleRegister} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="Dr. John Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700">
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                    <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="e.g. Cardiology" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="john@hospital.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="+91 (00000)" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700 tracking-widest" placeholder="••••••••" minLength="6" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={registering} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2 text-lg">
                    {registering ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-sm font-medium text-slate-500">
              Powered by <span className="font-extrabold text-slate-700 tracking-tight">ZUNA</span> Enterprise Health
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistration;
