import React, { useState } from 'react';
import { showPopup } from '../utils/popup';
import { motion } from 'framer-motion';
import { Building2, Clock, ShieldCheck, HeartPulse, Stethoscope, Activity, Eye, EyeOff } from 'lucide-react';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Modal from '../shared/components/Modal';

const calculatePrice = (count) => {
  const numCount = Number(count) || 0;
  if (numCount <= 0) return 0;
  return numCount > 100 ? numCount * 350 : numCount * 500;
};

const RegisterHospital = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hospitalName: '',
    chiefDoctorName: '',
    registrationNo: '', 
    gstNo: '',
    address: '',
    contact: '',
    email: '',
    password: '',
    patientCount: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Auth User for Admin
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create Hospital Record as 'pending'
      const hospitalRef = await addDoc(collection(db, 'hospitals'), {
        hospitalName: formData.hospitalName,
        chiefDoctorName: formData.chiefDoctorName,
        registrationNo: formData.registrationNo,
        gstNo: formData.gstNo,
        address: formData.address,
        contact: formData.contact,
        adminEmail: formData.email,
        createdAt: serverTimestamp(),
        status: 'pending', // SUPERADMIN APPROVAL REQUIRED
        subscription: 'premium',
        patientCount: Number(formData.patientCount) || 0,
        estimatedPrice: calculatePrice(formData.patientCount)
      });

      // 3. Create User Profile
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.chiefDoctorName,
        email: formData.email,
        role: 'admin',
        hospitalId: hospitalRef.id,
        createdAt: serverTimestamp()
      });

      // Set local storage and open modal
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('hospitalId', hospitalRef.id);
      localStorage.setItem('userId', user.uid);
      setIsModalOpen(true);
      
    } catch (error) {
      console.error("Registration Error: ", error);
      showPopup("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const proceedToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-screen flex w-full bg-surface overflow-hidden">
      
      {/* Left Side: Animated Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-gradient-to-br from-indigo-600 via-primary to-sky-400 text-white p-12 relative overflow-hidden flex-col justify-center items-center">
        
        {/* Animated Background Shapes */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-white opacity-10 rounded-[40%] blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-sky-200 opacity-20 rounded-[30%] blur-3xl"
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 opacity-20"
          >
            <Building2 size={64} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 30, 0] }} 
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/4 opacity-20"
          >
            <ShieldCheck size={80} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-1/5 opacity-20"
          >
            <HeartPulse size={48} />
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
            Join ZUNA <br/> <span className="text-sky-200">Enterprise</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg text-indigo-100 font-medium leading-relaxed"
          >
            Register your hospital today to unlock a world-class health management system for your staff and patients.
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
            className="w-full max-w-3xl bg-white rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 my-auto"
          >
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
                <Building2 className="text-indigo-500" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Setup Your Hospital</h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">Create your admin account and register your workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="font-bold text-slate-700 border-b pb-2">Hospital Details</h3>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Hospital Name *</label>
                  <input required name="hospitalName" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="Apollo Clinic" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Clinical Est. Reg No. *</label>
                  <input required name="registrationNo" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="Reg No. (Indian Law)" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">GSTIN (Optional)</label>
                  <input name="gstNo" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Contact Number *</label>
                  <input required name="contact" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="+91 9876543210" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Full Address *</label>
                  <textarea required name="address" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 min-h-[80px]" placeholder="123 Health Ave, Mumbai, India"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1"> Patients Count*</label>
                  <input 
                    required 
                    type="number" 
                    name="patientCount" 
                    min="1"
                    value={formData.patientCount}
                    onChange={handleChange} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" 
                    placeholder="e.g. 150" 
                  />
                </div>

                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl p-6">
                  <h4 className="font-bold text-indigo-950 mb-3 flex items-center gap-2">
                    <Activity className="text-indigo-600" size={20} />
                    Pricing & Monthly Estimate
                  </h4>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-4 shadow-sm">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Standard Rate (≤ 100 Patients)</span>
                      <span className="text-lg font-bold text-slate-800">₹500 <span className="text-sm font-medium text-slate-500">/ patient</span></span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">Volume Discount</div>
                      <span className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Enterprise Rate (&gt; 100 Patients)</span>
                      <span className="text-lg font-bold text-indigo-950">₹350 <span className="text-sm font-medium text-slate-500">/ patient</span></span>
                    </div>
                  </div>

                  {formData.patientCount && Number(formData.patientCount) > 0 ? (
                    <div className="border-t border-indigo-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-sm text-indigo-950 font-medium">Applied Rate: </span>
                        <span className="font-semibold text-indigo-700">
                          ₹{Number(formData.patientCount) > 100 ? '350' : '500'} per patient
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Calculation: {formData.patientCount} × ₹{Number(formData.patientCount) > 100 ? '350' : '500'}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Estimated Monthly Total</span>
                        <span className="text-2xl font-extrabold text-indigo-600">
                          ₹{calculatePrice(formData.patientCount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-indigo-100 pt-4 text-sm text-slate-500 italic">
                      Enter estimated monthly patients above to calculate your pricing estimate.
                    </div>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 mt-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2">Admin Credentials</h3>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Chief Doctor (Admin) *</label>
                  <input required name="chiefDoctorName" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="Dr. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Admin Email *</label>
                  <input required type="email" name="email" onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700" placeholder="admin@hospital.com" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password *</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} name="password" onChange={handleChange} className={`w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 ${!showPassword ? 'tracking-widest' : ''}`} placeholder="••••••••" />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] mt-6 flex justify-center items-center gap-2 text-lg">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Register & Request Approval'
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400 font-medium">
                By registering, you agree to ZUNA Enterprise Terms of Service.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={proceedToDashboard} title="Request Submitted">
        <div className="text-center space-y-6 py-4">
          <div className="flex justify-center">
            <Clock size={64} className="text-orange-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-800">Pending Superadmin Approval</h4>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Your hospital registration has been received successfully! <br/>
              However, to ensure compliance with our platform policies, a Superadmin must review and approve your account before your workspace is unlocked.
            </p>
          </div>
          <button onClick={proceedToDashboard} className="btn-primary w-full py-3">
            View Status Dashboard
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterHospital;
