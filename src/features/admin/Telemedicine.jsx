import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { showConfirm } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Calendar, Link as LinkIcon, User, Plus, X, CheckCircle2, Clock, Play } from 'lucide-react';

const Telemedicine = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const hospitalId = localStorage.getItem('hospitalId');
  const doctorName = "Dr. Jane Smith"; // Ideally from auth

  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    date: '',
    time: '',
    duration: '30',
    reason: ''
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'telemedicine'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      // Sort upcoming first
      records.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      setAppointments(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      // Generate a mock meet link
      const meetingId = Math.random().toString(36).substring(2, 12);
      const meetingLink = `https://meet.zunahealth.com/${meetingId}`;

      await addDoc(collection(db, 'telemedicine'), {
        ...formData,
        hospitalId,
        doctorName,
        meetingLink,
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({
        patientName: '', patientEmail: '', date: '', time: '', duration: '30', reason: ''
      });
    } catch (error) {
      console.error("Error scheduling appointment:", error);
    }
  };

  const completeAppointment = async (id) => {
    showConfirm("Mark this consultation as completed?", async () => {
      try {
        await updateDoc(doc(db, 'telemedicine', id), {
          status: 'completed'
        });
      } catch (error) {
        console.error("Error updating appointment:", error);
      }
    });
  };

  const upcoming = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Telemedicine Hub</h1>
          <p className="text-slate-500 mt-1">Manage virtual consultations and remote patient care.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Calendar size={20} /> Schedule Virtual Visit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="glass-panel p-6 flex items-center justify-between border-b-4 border-b-sky-500">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Upcoming Calls</p>
            <p className="text-3xl font-extrabold text-slate-800">{upcoming.length}</p>
          </div>
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-primary">
            <Video size={24} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col overflow-hidden">
        <h3 className="font-bold text-lg text-slate-800 mb-6">Today's Schedule</h3>

        <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
              <Video size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-lg text-slate-700">No upcoming consultations</p>
              <p className="text-sm text-slate-500 mt-1">Click "Schedule Virtual Visit" to book a patient.</p>
            </div>
          ) : (
            upcoming.map(app => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0 text-primary">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-lg">{app.patientName}</h3>
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">{app.duration} mins</span>
                    </div>
                    <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-slate-400"/>
                      {new Date(app.date).toLocaleDateString()} at {app.time}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-md">Reason: {app.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:ml-auto md:border-l md:border-slate-100 md:pl-6">
                  <div className="relative group">
                    <button className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-colors" title="Copy Meeting Link">
                      <LinkIcon size={18} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Copy Link
                    </div>
                  </div>
                  
                  <button onClick={() => completeAppointment(app.id)} className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50 transition-colors" title="Mark as Completed">
                    <CheckCircle2 size={18} />
                  </button>
                  
                  <a href={app.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-primary hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                    <Play size={16} className="fill-current" /> Join Call
                  </a>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Schedule Virtual Visit</h2>
                  <p className="text-sm text-slate-500">Book a telemedicine consultation.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSchedule} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Patient Name</label>
                  <input type="text" name="patientName" required value={formData.patientName} onChange={handleChange} className="input-field" placeholder="Full Name" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Patient Email (For Link)</label>
                  <input type="email" name="patientEmail" required value={formData.patientEmail} onChange={handleChange} className="input-field" placeholder="patient@example.com" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                    <input type="date" name="date" required value={formData.date} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Time</label>
                    <input type="time" name="time" required value={formData.time} onChange={handleChange} className="input-field" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Duration (Minutes)</label>
                  <select name="duration" value={formData.duration} onChange={handleChange} className="input-field font-bold text-slate-700">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Consultation Reason</label>
                  <textarea name="reason" required value={formData.reason} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Brief description of symptoms..."></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <Calendar size={18} />
                    Schedule Call
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Telemedicine;
