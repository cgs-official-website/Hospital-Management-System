import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, XCircle, Search, FileText, Plus } from 'lucide-react';
import { showPopup } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const AppointmentScheduling = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    notes: ''
  });

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

    // Fetch Patients
    const qPat = query(collection(db, 'patients'), where('hospitalId', '==', hospitalId));
    const unsubPat = onSnapshot(qPat, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

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

    return () => { unsubscribe(); unsubPat(); };
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

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const patient = patients.find(p => p.id === formData.patientId);
      const doctor = doctors.find(d => d.id === formData.doctorId);
      
      await addDoc(collection(db, 'appointments'), {
        hospitalId,
        patientId: formData.patientId,
        patientName: patient?.name || 'Unknown',
        doctorId: formData.doctorId,
        doctorName: doctor?.name || 'Unknown',
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
      showPopup('Appointment booked successfully', 'success');
    } catch (error) {
      console.error("Error booking appointment", error);
      showPopup('Failed to book appointment', 'error');
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
    ((app.patientName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
    app.contactNumber?.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointment Scheduling</h2>
          <p className="text-sm text-slate-500">Manage incoming patient bookings and assign doctors.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 h-10 py-1 text-sm w-full"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary h-10 px-4 whitespace-nowrap">
            <Plus size={16} /> Book Appt
          </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Appointment">
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Patient</label>
            <select required className="input-field" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.contact})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Select Doctor</label>
            <select required className="input-field" value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
              <option value="">-- Choose Doctor --</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input required type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input required type="time" className="input-field" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} min={formData.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().substring(0, 5) : undefined} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input type="text" className="input-field" placeholder="Reason for visit..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary w-full mt-2">Book Appointment</button>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentScheduling;
