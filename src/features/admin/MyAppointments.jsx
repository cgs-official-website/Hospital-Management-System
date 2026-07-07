import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CalendarDays, Clock, FileText } from 'lucide-react';
import Modal from '../../shared/components/Modal';

const MyAppointments = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const userId = localStorage.getItem('userId');
  const [appointments, setAppointments] = useState([]);
  
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hospitalId || !userId) return;
    
    // Fetch only this doctor's appointments
    const q = query(collection(db, 'appointments'), 
      where('hospitalId', '==', hospitalId),
      where('doctorId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date/time locally for simplicity
      list.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      setAppointments(list);
    });

    return () => unsubscribe();
  }, [hospitalId, userId]);

  const handleStartConsultation = (app) => {
    setActiveConsultation(app);
    setNotes(app.consultationNotes || '');
    setPrescription(app.prescription || '');
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!activeConsultation) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'appointments', activeConsultation.id), {
        status: 'completed',
        consultationNotes: notes,
        prescription: prescription
      });
      setActiveConsultation(null);
    } catch (error) {
      console.error("Error completing consultation", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">My Schedule</h2>
        <p className="text-sm text-slate-500">View your upcoming patients for the day.</p>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            Your schedule is clear. No appointments assigned.
          </div>
        ) : (
          appointments.map(app => (
            <div key={app.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all">
              <div className="flex items-center gap-5">
                <div className="bg-sky-50 p-3 rounded-lg text-primary text-center min-w-[80px]">
                  <span className="block text-xs font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', {weekday:'short'})}</span>
                  <span className="block text-xl font-black">{new Date(app.date).getDate()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{app.patientName}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Clock size={14} /> {app.time}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  app.status === 'completed' ? 'bg-green-100 text-green-700' :
                  app.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {app.status}
                </span>
                <button 
                  onClick={() => handleStartConsultation(app)}
                  className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={app.status === 'completed' || app.status === 'cancelled'}
                >
                  Start Consultation
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={!!activeConsultation} onClose={() => setActiveConsultation(null)} title={`Consultation: ${activeConsultation?.patientName}`}>
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Consultation Notes</label>
            <textarea 
              className="input-field min-h-[100px] py-3" 
              placeholder="Enter patient symptoms, diagnosis, and general notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Prescription (Optional)</label>
            <textarea 
              className="input-field min-h-[100px] py-3" 
              placeholder="Enter medications, dosage, and instructions..."
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={() => setActiveConsultation(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <FileText size={18} />
              {saving ? 'Saving...' : 'Complete Consultation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyAppointments;
