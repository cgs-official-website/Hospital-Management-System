import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FileText, CalendarDays, User, Stethoscope } from 'lucide-react';

const DoctorConsultations = ({ viewMode = 'all' }) => {
  const hospitalId = localStorage.getItem('hospitalId');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole');
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    
    let q;
    if (role === 'doctor' || viewMode === 'history') {
      q = query(collection(db, 'appointments'), 
        where('hospitalId', '==', hospitalId),
        where('doctorId', '==', userId),
        where('status', '==', 'completed')
      );
    } else {
      q = query(collection(db, 'appointments'), 
        where('hospitalId', '==', hospitalId),
        where('status', '==', 'completed')
      );
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
      setConsultations(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId, userId, role, viewMode]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading consultations...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {viewMode === 'history' ? <FileText className="text-primary"/> : <Stethoscope className="text-primary"/>} 
          {viewMode === 'history' ? 'Patient History' : 'Doctor Consultations'}
        </h2>
        <p className="text-sm text-slate-500">
          {viewMode === 'history' ? 'View your previously completed consultations and patient records.' : 'Overview of all completed clinical consultations.'}
        </p>
      </div>
      
      <div className="grid gap-4">
        {consultations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            No consultation records found.
          </div>
        ) : (
          consultations.map(record => (
            <div key={record.id} className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-primary/30 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 pb-4 border-b border-slate-200 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <User size={18} className="text-slate-400"/> {record.patientName}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays size={14} /> {record.date} at {record.time}</span>
                    {role !== 'doctor' && viewMode !== 'history' && (
                      <span className="flex items-center gap-1"><Stethoscope size={14} /> Dr. {record.doctorName}</span>
                    )}
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 w-fit">Completed</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    Consultation Notes
                  </h4>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 min-h-[100px] shadow-sm">
                    {record.consultationNotes || <span className="italic text-slate-400">No clinical notes provided.</span>}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    Prescription
                  </h4>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 min-h-[100px] shadow-sm">
                    {record.prescription || <span className="italic text-slate-400">No prescription provided.</span>}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorConsultations;
