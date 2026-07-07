import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, XCircle, Search, FileText } from 'lucide-react';
import { showPopup } from '../../utils/popup';

const AppointmentScheduling = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!hospitalId) return;

    // Fetch doctors
    const fetchDoctors = async () => {
      const q = query(collection(db, 'users'), where('hospitalId', '==', hospitalId), where('role', '==', 'doctor'));
      const snap = await getDocs(q);
      const docsList = [];
      snap.forEach(doc => docsList.push({ id: doc.id, ...doc.data() }));
      setDoctors(docsList);
    };
    fetchDoctors();

    // Listen to appointments
    const q = query(collection(db, 'appointments'), where('hospitalId', '==', hospitalId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        // Simple sort: Pending first, then by date (descending for now)
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`);
      });
      setAppointments(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      await updateDoc(docRef, { status: newStatus });
      showPopup(`Appointment marked as ${newStatus}`, 'success');
    } catch (error) {
      console.error("Error updating appointment:", error);
      showPopup('Failed to update status', 'error');
    }
  };

  const handleAssignDoctor = async (appointmentId, doctorId) => {
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      await updateDoc(docRef, { doctorId: doctorId });
      showPopup('Doctor assigned successfully', 'success');
    } catch (error) {
      console.error("Error assigning doctor:", error);
      showPopup('Failed to assign doctor', 'error');
    }
  };

  const filteredAppointments = appointments.filter(app => 
    app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.contactNumber?.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointment Scheduling</h2>
          <p className="text-sm text-slate-500">Manage incoming patient bookings and assign doctors.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 h-10 py-1 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CalendarIcon size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Appointments Found</h3>
            <p className="text-slate-500 text-sm">When patients book online, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map(app => (
              <div key={app.id} className={`p-5 border rounded-xl transition-all ${app.status === 'pending' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 hover:border-primary/30'}`}>
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  
                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{app.patientName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        app.status === 'completed' ? 'bg-green-100 text-green-700' :
                        app.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        app.status === 'scheduled' ? 'bg-sky-100 text-sky-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-3">
                      <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {app.contactNumber}</span>
                      <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-slate-400"/> {app.date}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {app.time}</span>
                    </div>
                    {app.symptoms && (
                      <div className="bg-white/60 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-2 items-start">
                        <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p>{app.symptoms}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Assignment */}
                  <div className="lg:w-72 flex flex-col justify-between gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Doctor</label>
                      <select 
                        value={app.doctorId || ''}
                        onChange={(e) => handleAssignDoctor(app.id, e.target.value)}
                        className="input-field py-1.5 text-sm"
                        disabled={app.status === 'cancelled' || app.status === 'completed'}
                      >
                        <option value="">Unassigned</option>
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                        ))}
                      </select>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'scheduled')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle2 size={16} /> Confirm
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                          className="flex-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                    
                    {app.status === 'scheduled' && (
                      <button 
                        onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                        className="w-full bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 py-1.5 rounded-lg text-sm font-bold transition-colors"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentScheduling;
