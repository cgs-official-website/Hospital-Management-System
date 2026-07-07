import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { MonitorPlay, Users } from 'lucide-react';

const QueueManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!hospitalId) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Listen to today's appointments to derive queue status
    const q = query(collection(db, 'appointments'), 
      where('hospitalId', '==', hospitalId),
      where('date', '==', today)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.time.localeCompare(b.time)); // Sort by time to emulate queue
      setQueue(list);
    });
    return () => unsub();
  }, [hospitalId]);

  const waiting = queue.filter(q => q.status === 'scheduled');
  const inProgress = queue.filter(q => q.status === 'in-progress');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live Queue Board</h2>
          <p className="text-sm text-slate-500">Track tokens and patient flow for the front desk.</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <MonitorPlay size={18} /> Open Display Mode
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* In Progress */}
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span> Now Consulting
          </h3>
          <div className="space-y-4">
            {inProgress.length === 0 ? (
              <p className="text-slate-500 text-sm">No doctors currently consulting.</p>
            ) : (
              inProgress.map((app, idx) => (
                <div key={app.id} className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-blue-900 font-bold text-2xl">TKN-{idx + 101}</p>
                    <p className="text-sm text-blue-700">{app.patientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-bold uppercase">Doctor</p>
                    <p className="text-sm text-blue-800 font-medium">Dr. {app.doctorName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Waiting */}
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
            <Users size={20} className="text-orange-500" /> Waiting List
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            {waiting.length === 0 ? (
              <p className="text-slate-500 text-sm p-6 text-center">Queue is empty.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {waiting.map((app, idx) => (
                  <li key={app.id} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded">TKN-{inProgress.length + idx + 101}</span>
                      <span className="font-medium text-slate-800">{app.patientName}</span>
                    </div>
                    <span className="text-sm text-slate-500">Dr. {app.doctorName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;
