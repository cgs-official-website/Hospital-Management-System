import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { showPopup } from '../../utils/popup';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Save, CheckCircle2, Shield, Activity, CreditCard, Users, Bed, Image as ImageIcon, Link as LinkIcon, Copy, Globe } from 'lucide-react';

const HospitalProfile = () => {
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const hospitalId = localStorage.getItem('hospitalId');
  const registerUrl = hospitalData?.hospitalName ? `${window.location.origin}/register/employee/${encodeURIComponent(hospitalData.hospitalName)}` : '';
  const patientBookingUrl = hospitalId ? `${window.location.origin}/clinic/${hospitalId}` : '';

  const [formData, setFormData] = useState({
    hospitalName: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    logoBase64: ''
  });

  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!hospitalId) return;
      try {
        const docRef = doc(db, 'hospitals', hospitalId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHospitalData(data);
          setFormData({
            hospitalName: data.hospitalName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            contactPerson: data.contactPerson || '',
            logoBase64: data.logoBase64 || ''
          });
        }
      } catch (error) {
        console.error("Error fetching hospital profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [hospitalId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = (url, msg) => {
    navigator.clipboard.writeText(url);
    showPopup(msg, 'success');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hospitalId) return;
    
    setSaving(true);
    setSuccessMsg('');
    try {
      const docRef = doc(db, 'hospitals', hospitalId);
      await updateDoc(docRef, {
        hospitalName: formData.hospitalName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        logoBase64: formData.logoBase64
      });
      setSuccessMsg('Hospital profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Hospital Profile</h1>
          <p className="text-slate-500 mt-1">Manage your workspace settings and view subscription limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 md:p-8"
          >
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="relative group cursor-pointer w-20 h-20 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 overflow-hidden">
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                  <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Upload</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Hospital Logo</h3>
                  <p className="text-sm text-slate-500">Upload your organization's logo (PNG, JPG)</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-primary flex items-center justify-center border border-sky-100">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Workspace Details</h3>
                  <p className="text-sm text-slate-500">Update your primary hospital information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Hospital Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="e.g. City General Hospital"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Contact Person (Admin)</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="e.g. Dr. Sarah Smith"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="contact@hospital.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="+91 (00000) 000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                    <textarea 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input-field pl-12 min-h-[100px] py-3"
                      placeholder="123 Medical Center Blvd..."
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {successMsg ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                    <CheckCircle2 size={18} />
                    <span className="font-bold text-sm">{successMsg}</span>
                  </div>
                ) : (
                  <div></div>
                )}
                
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* Right Col - Subscription Details & Registration Link */}
        <div className="space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="text-primary" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Employee Onboarding</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Share this link with your staff so they can self-register into your hospital's workspace.</p>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <input 
                type="text" 
                readOnly 
                value={registerUrl} 
                className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 p-3 w-full"
              />
              <button 
                onClick={() => handleCopyLink(registerUrl, "Registration link copied!")}
                className="p-3 text-primary hover:bg-sky-50 transition-colors border-l border-slate-200"
                title="Copy Link"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-8">
              <Globe className="text-primary" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Patient Booking Portal</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Your public landing page where patients can book appointments directly.</p>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-2">
              <input 
                type="text" 
                readOnly 
                value={patientBookingUrl} 
                className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 p-3 w-full"
              />
              <button 
                onClick={() => handleCopyLink(patientBookingUrl, "Patient booking link copied!")}
                className="p-3 text-primary hover:bg-sky-50 transition-colors border-l border-slate-200"
                title="Copy Link"
              >
                <Copy size={16} />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-emerald-500" size={24} />
              <h3 className="text-lg font-bold text-slate-800">Subscription Status</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Plan Tier</p>
                  <p className="font-extrabold text-slate-800 text-lg capitalize">{hospitalData?.subscriptionPlan || 'Free Tier'}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspace Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="font-extrabold text-slate-800 capitalize">{hospitalData?.status || 'Active'}</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Activity size={20} />
                </div>
              </div>

            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Resource Limits</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-600">
                  <Users size={18} className="text-sky-500" />
                  <span className="font-medium text-sm">Staff Accounts</span>
                </div>
                <span className="font-bold text-slate-800">Unlimited</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-600">
                  <Bed size={18} className="text-orange-500" />
                  <span className="font-medium text-sm">IPD Beds</span>
                </div>
                <span className="font-bold text-slate-800">{hospitalData?.limits?.beds || '100'}</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default HospitalProfile;
