import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Bed, Users, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const BedWardManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setAdmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [hospitalId]);

  // Group by department/ward
  const wards = admissions.reduce((acc, patient) => {
    const ward = patient.department || 'Unassigned';
    if (!acc[ward]) acc[ward] = [];
    acc[ward].push(patient);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col overflow-hidden">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Bed className="text-primary"/> Bed & Ward Map</h2>
        <p className="text-sm text-slate-500 mt-1">Visual overview of inpatient bed occupancy across all departments.</p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6 space-y-8">
        {Object.keys(wards).length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Bed size={64} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-xl text-slate-600">All Wards Empty</p>
            <p className="text-sm mt-2">No admitted patients found in the hospital.</p>
          </div>
        ) : (
          Object.keys(wards).map((wardName, index) => (
            <div key={index} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-sky-500" size={20}/> {wardName}
                </h3>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-slate-600 border border-slate-200 shadow-sm flex items-center gap-1">
                  <Users size={16}/> {wards[wardName].length} Patients
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 md:grid-cols-4 gap-4">
                {wards[wardName].sort((a,b) => a.bedNumber?.localeCompare(b.bedNumber)).map(patient => (
                  <div key={patient.id} className={`bg-white border p-4 rounded-xl shadow-sm transition-all ${
                    patient.dischargeRequested ? 'border-orange-200 shadow-orange-100/50' : 'border-emerald-200 shadow-emerald-100/50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-sm flex items-center gap-1">
                        <Bed size={14}/> {patient.bedNumber}
                      </div>
                      {patient.dischargeRequested ? (
                        <span className="text-orange-500 flex items-center gap-1 text-xs font-bold" title="Discharge Requested">
                          <AlertCircle size={14}/> Discharge
                        </span>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                          <CheckCircle2 size={14}/> Occupied
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-slate-800 truncate">{patient.patientName}</h4>
                    <p className="text-xs text-slate-500 mb-2">ID: {patient.patientId || 'N/A'} • {patient.age}y {patient.gender.charAt(0)}</p>
                    
                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="font-bold text-slate-600 truncate">Dr. {patient.attendingDoctor}</p>
                      <p className="text-slate-500 truncate" title={patient.admissionReason}>{patient.admissionReason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BedWardManagement;
