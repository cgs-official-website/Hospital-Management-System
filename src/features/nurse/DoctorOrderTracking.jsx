import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Stethoscope, FileText, Pill, Activity, AlertCircle, Clock } from 'lucide-react';

const DoctorOrderTracking = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch admitted patients to know who to look for
  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  // 2. Fetch consultations (orders) for these patients
  useEffect(() => {
    if (!hospitalId || patients.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Ideally we would query consultations by patientId array, but Firestore 'in' queries are limited to 10.
    // For demo purposes, we fetch all consultations for the hospital and filter locally for admitted patients.
    const q = query(collection(db, 'consultations'), where('hospitalId', '==', hospitalId));
    
    const unsub = onSnapshot(q, (snap) => {
      let activeOrders = [];
      const admittedNames = patients.map(p => p.patientName);
      
      snap.forEach(doc => {
        const data = doc.data();
        // Check if this consultation belongs to an admitted patient
        if (admittedNames.includes(data.patientName)) {
          // Find the specific admission details for bed number etc.
          const patientDetails = patients.find(p => p.patientName === data.patientName);
          
          activeOrders.push({
            id: doc.id,
            ...data,
            bedNumber: patientDetails?.bedNumber,
            department: patientDetails?.department
          });
        }
      });
      
      // Sort by newest first
      setOrders(activeOrders.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId, patients]);

  const filteredOrders = orders.filter(o => 
    o.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctor Orders</h2>
          <p className="text-sm text-slate-500">Track and review active medical orders for admitted patients.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search patient or doctor..." 
            className="input-field pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6 pb-6">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <FileText size={64} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-xl text-slate-600">No Active Orders</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">There are currently no doctor consultations or orders found for any admitted patients.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                
                {/* Decorative side accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Left Column: Patient & Doctor Info */}
                  <div className="md:w-1/3 border-r border-slate-100 pr-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12}/> {order.date ? new Date(order.date.seconds * 1000).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800">{order.patientName}</h3>
                    <p className="text-sm font-medium text-slate-600 mb-4 flex flex-wrap gap-2 items-center">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">Bed {order.bedNumber || '?'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{order.department || 'Ward'}</span>
                    </p>
                    
                    <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 mt-auto">
                      <p className="text-xs text-sky-600 font-bold flex items-center gap-1 mb-1"><Stethoscope size={14}/> Ordering Physician</p>
                      <p className="font-bold text-slate-700">Dr. {order.doctorName}</p>
                    </div>
                  </div>

                  {/* Right Column: Orders/Details */}
                  <div className="md:w-2/3 space-y-4">
                    
                    {/* Diagnosis / Notes */}
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <FileText size={16}/> Clinical Notes / Diagnosis
                      </p>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                        {order.notes || order.diagnosis || 'No clinical notes provided.'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Prescriptions */}
                      {order.medications && order.medications.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Pill size={16}/> Prescriptions
                          </p>
                          <ul className="space-y-2">
                            {order.medications.map((med, idx) => (
                              <li key={idx} className="bg-white border border-emerald-100 p-2 rounded-lg shadow-sm text-sm">
                                <p className="font-bold text-slate-800">{med.name}</p>
                                <p className="text-xs text-slate-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lab Tests */}
                      {order.labTests && order.labTests.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity size={16}/> Lab Orders
                          </p>
                          <ul className="space-y-2">
                            {order.labTests.map((test, idx) => (
                              <li key={idx} className="bg-white border border-indigo-100 p-2 rounded-lg shadow-sm text-sm">
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                  <AlertCircle size={14} className="text-indigo-400"/> {test}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
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

export default DoctorOrderTracking;
