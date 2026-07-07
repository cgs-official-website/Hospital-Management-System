import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

const OPDManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!hospitalId) return;
    // OPD fetches appointments for the day that are "scheduled" or "in-progress"
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(collection(db, 'appointments'), 
      where('hospitalId', '==', hospitalId),
      where('date', '==', today)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'appointments', id), { status });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">OPD Outpatient Flow</h2>
        <p className="text-sm text-slate-500">Monitor and manage the live outpatient queue for today.</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        {(() => {
          const totalPages = Math.ceil(appointments.length / itemsPerPage);
          const currentAppointments = appointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          
          return (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                    <th className="py-3 px-4 font-medium">Time / Token</th>
                    <th className="py-3 px-4 font-medium">Patient</th>
                    <th className="py-3 px-4 font-medium">Consulting Doctor</th>
                    <th className="py-3 px-4 font-medium">Current Stage</th>
                    <th className="py-3 px-4 font-medium text-right">Flow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-500">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        No outpatient visits scheduled for today.
                      </td>
                    </tr>
                  ) : (
                    currentAppointments.map((app, idx) => (
                      <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800 block">{app.time}</span>
                          <span className="text-xs font-bold text-primary bg-sky-50 px-2 py-0.5 rounded">TKN-{idx + 101}</span>
                        </td>
                        <td className="py-4 px-4 font-medium">{app.patientName}</td>
                        <td className="py-4 px-4 text-slate-600">Dr. {app.doctorName}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-max ${
                            app.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                            app.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            app.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {app.status === 'scheduled' && <Users size={14}/>}
                            {app.status === 'in-progress' && <Stethoscope size={14}/>}
                            {app.status === 'completed' && <CheckCircle2 size={14}/>}
                            {app.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex justify-end gap-2">
                          {app.status === 'scheduled' && (
                            <button onClick={() => updateStatus(app.id, 'in-progress')} className="btn-secondary py-1.5 px-3 text-sm">Send to Doctor</button>
                          )}
                          {app.status === 'in-progress' && (
                            <button onClick={() => updateStatus(app.id, 'completed')} className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-xl font-bold text-sm shadow-sm">Complete</button>
                          )}
                          {app.status === 'completed' && (
                            <button className="text-slate-400 hover:text-primary p-2"><FileText size={18}/></button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 sticky bottom-0 z-10 gap-4">
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
    </div>
  );
};

export default OPDManagement;
