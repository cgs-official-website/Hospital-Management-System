import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Clock, User, Phone, FileText, CheckCircle2, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showPopup } from '../utils/popup';

const VendorLandingPage = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [formData, setFormData] = useState({
    patientName: '',
    contactNumber: '',
    date: '',
    time: '',
    doctorId: '',
    symptoms: ''
  });

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        if (!hospitalId) return;

        // Fetch hospital config
        const hospitalRef = doc(db, 'hospitals', hospitalId);
        const hospitalSnap = await getDoc(hospitalRef);
        
        if (hospitalSnap.exists()) {
          setHospitalData(hospitalSnap.data());
          
          // Fetch doctors for this hospital
          const q = query(collection(db, 'users'), where('hospitalId', '==', hospitalId), where('role', '==', 'doctor'));
          const querySnapshot = await getDocs(q);
          const docsList = [];
          querySnapshot.forEach((doc) => {
            docsList.push({ id: doc.id, ...doc.data() });
          });
          setDoctors(docsList);
        } else {
          showPopup('Hospital not found', 'error');
        }
      } catch (error) {
        console.error("Error fetching hospital details:", error);
        showPopup('Error loading portal', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalDetails();
  }, [hospitalId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await addDoc(collection(db, 'appointments'), {
        hospitalId,
        patientName: formData.patientName,
        contactNumber: formData.contactNumber,
        date: formData.date,
        time: formData.time,
        doctorId: formData.doctorId,
        symptoms: formData.symptoms,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setBookingSuccess(true);
      showPopup('Appointment request submitted!', 'success');
      
      // Reset form
      setFormData({
        patientName: '',
        contactNumber: '',
        date: '',
        time: '',
        doctorId: '',
        symptoms: ''
      });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setBookingSuccess(false), 5000);
      
    } catch (error) {
      console.error("Error booking appointment:", error);
      showPopup('Failed to book appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Activity className="text-primary animate-pulse w-12 h-12 mb-4" />
        <p className="text-slate-500 font-medium">Loading hospital portal...</p>
      </div>
    );
  }

  if (!hospitalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Hospital Not Found</h2>
        <p className="text-slate-500 mb-6">The link you followed may be broken or expired.</p>
        <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2">
          <ArrowLeft size={18} /> Back to ZUNA
        </button>
      </div>
    );
  }

  const allTimeSlots = [
    "09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", 
    "02:30 PM", "04:00 PM", "05:30 PM"
  ];

  const getAvailableTimeSlots = () => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.date === today) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      return allTimeSlots.filter(slot => {
        const [time, period] = slot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        if (hours > currentHours) return true;
        if (hours === currentHours && minutes > currentMinutes) return true;
        return false;
      });
    }
    return allTimeSlots;
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans overflow-x-hidden pb-20">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-b-[4rem] -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(38, 166, 137, 0.1), transparent 25%), radial-gradient(circle at 85% 30%, rgba(38, 166, 137, 0.15), transparent 25%)'
             }}>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto pt-10 px-6 pb-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {hospitalData.logoBase64 ? (
            <img src={hospitalData.logoBase64} alt={hospitalData.hospitalName} className="h-20 w-auto object-contain mb-4 rounded-xl shadow-sm" />
          ) : (
            <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-primary text-2xl font-bold border border-slate-100">
              {hospitalData.hospitalName.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to {hospitalData.hospitalName}
          </h1>
          <p className="text-slate-500 mt-3 font-medium max-w-xl mx-auto">
            Book your appointment online and skip the waiting room. Fill out the form below to request a consultation.
          </p>
        </motion.div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-glass border border-slate-100 p-8 md:p-10 relative overflow-hidden"
        >
          
          <AnimatePresence>
            {bookingSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center text-center p-10"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Booking Confirmed!</h2>
                <p className="text-slate-600 font-medium mb-8">
                  Your appointment request has been sent to {hospitalData.hospitalName}. You will receive a confirmation shortly.
                </p>
                <button 
                  onClick={() => setBookingSuccess(false)}
                  className="btn-secondary px-8 py-3"
                >
                  Book Another Appointment
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Patient Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                    className="input-field pl-12"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    className="input-field pl-12"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="input-field pl-12 appearance-none"
                  >
                    <option value="" disabled>Select a time slot</option>
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))
                    ) : (
                      <option value="" disabled>No more slots available today</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Specialist (Optional)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="input-field pl-12 appearance-none"
                >
                  <option value="">Any Available Specialist</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Symptoms / Reason */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Reason for Visit / Symptoms</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="input-field pl-12 py-3"
                  placeholder="Briefly describe your symptoms or reason for visit..."
                ></textarea>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full py-4 text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm Booking Request <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-500 mt-4">
              By booking, you agree to {hospitalData.hospitalName}'s cancellation policies.
            </p>
          </form>
        </motion.div>
      </main>

    </div>
  );
};

export default VendorLandingPage;
