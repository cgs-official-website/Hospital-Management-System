import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../shared/components/Modal';

const Appointments = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
    
    // Fetch Appointments
    const qAppt = query(collection(db, 'appointments'), where('hospitalId', '==', hospitalId));
    const unsubAppt = onSnapshot(qAppt, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Patients
    const qPat = query(collection(db, 'patients'), where('hospitalId', '==', hospitalId));
    const unsubPat = onSnapshot(qPat, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Doctors (Admins and Visiting Doctors)
    const qDoc = query(collection(db, 'users'), where('hospitalId', '==', hospitalId));
    const unsubDoc = onSnapshot(qDoc, (snap) => {
      const docs = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.role === 'doctor' || data.role === 'admin') {
          docs.push({ id: d.id, ...data });
        }
      });
      setDoctors(docs);
    });

    return () => { unsubAppt(); unsubPat(); unsubDoc(); };
  }, [hospitalId]);

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
    } catch (error) {
      console.error("Error booking appointment", error);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const getDoctorName = (doctorId, defaultName) => {
    if (!doctorId) return defaultName || 'Unassigned';
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : (defaultName || 'Unassigned');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointments Desk</h2>
          <p className="text-sm text-slate-500">Manage and schedule patient visits.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Book Appointment
        </button>
      </div>

      <div className="flex flex-col border border-slate-200 rounded-2xl bg-white/50 overflow-hidden">
        {(() => {
          const totalPages = Math.ceil(appointments.length / itemsPerPage);
          const currentAppointments = appointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          
          return (
            <>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                      <th className="py-3 px-4 font-medium">Date & Time</th>
                      <th className="py-3 px-4 font-medium">Patient</th>
                      <th className="py-3 px-4 font-medium">Doctor</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-500">
                          <CalendarClock size={32} className="mx-auto mb-2 opacity-50" />
                          No appointments scheduled.
                        </td>
                      </tr>
                    ) : (
                      currentAppointments.map(app => (
                        <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block">{app.date}</span>
                            <span className="text-sm text-slate-500">{app.time}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-primary">{app.patientName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {app.doctorId || app.doctorName ? `Dr. ${getDoctorName(app.doctorId, app.doctorName)}` : 'Unassigned'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                              app.status === 'completed' ? 'bg-green-100 text-green-700' :
                              app.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 flex justify-end gap-2">
                            {app.status === 'scheduled' && (
                              <>
                                <button onClick={() => handleStatus(app.id, 'completed')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Completed"><CheckCircle size={18}/></button>
                                <button onClick={() => handleStatus(app.id, 'cancelled')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel"><XCircle size={18}/></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 gap-4 shrink-0">
                  <span className="text-sm font-medium text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, appointments.length)} of {appointments.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
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
              <input required type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input required type="time" className="input-field" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
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

export default Appointments;
