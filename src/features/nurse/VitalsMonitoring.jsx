import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Activity, Heart, Thermometer, Droplets, Plus, Search } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { showPopup } from '../../utils/popup';

const VitalsMonitoring = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    spo2: ''
  });

  useEffect(() => {
    if (!hospitalId) return;
    // Fetch only currently admitted patients for active monitoring
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  useEffect(() => {
    if (!selectedPatient) {
      setPatientVitals([]);
      return;
    }
    
    // Fetch vitals history for the selected patient
    const q = query(
      collection(db, 'patient_vitals'), 
      where('hospitalId', '==', hospitalId),
      where('admissionId', '==', selectedPatient.id)
      // Can't use orderBy together with inequality/different field filters easily without compound index, so we sort locally
    );

    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      records.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setPatientVitals(records);
    });

    return () => unsub();
  }, [selectedPatient, hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'patient_vitals'), {
        hospitalId,
        admissionId: selectedPatient.id,
        patientName: selectedPatient.patientName,
        bloodPressure: formData.bloodPressure,
        heartRate: parseInt(formData.heartRate),
        temperature: parseFloat(formData.temperature),
        spo2: parseInt(formData.spo2),
        date: serverTimestamp()
      });
      
      showPopup("Vitals logged successfully", "success");
      setFormData({ bloodPressure: '', heartRate: '', temperature: '', spo2: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to log vitals", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (type, val) => {
    if (!val) return 'text-slate-500';
    if (type === 'hr') {
      return (val < 60 || val > 100) ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold';
    }
    if (type === 'temp') {
      return (val > 38 || val < 36) ? 'text-orange-500 font-bold' : 'text-emerald-600 font-bold';
    }
    if (type === 'spo2') {
      return (val < 95) ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold';
    }
    return 'text-slate-700';
  };

  const filteredPatients = patients.filter(p => p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left: Patient List */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Admitted Patients</h2>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="input-field pl-9 w-full text-sm py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-2">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-slate-400 mt-10 text-sm">No admitted patients found.</p>
          ) : (
            filteredPatients.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selectedPatient?.id === p.id ? 'bg-sky-50 border-sky-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
              >
                <p className="font-bold text-slate-800 truncate">{p.patientName}</p>
                <p className="text-xs text-slate-500">Bed: {p.bedNumber} • {p.department}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Vitals Dashboard */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.patientName}</h2>
                <p className="text-sm text-slate-500">Bed: {selectedPatient.bedNumber} | ID: {selectedPatient.patientId || 'N/A'}</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus size={18} /> Log Vitals
              </button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {patientVitals.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg">No Vitals Logged Yet</p>
                  <p className="text-sm mt-1">Click "Log Vitals" to record the first entry.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientVitals.map(v => (
                    <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Activity size={14} /> Recorded At
                        </span>
                        <span className="text-sm font-bold text-slate-600">
                          {v.date ? new Date(v.date.seconds * 1000).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                          <p className="text-xs text-rose-500 flex items-center gap-1 mb-1"><Heart size={14}/> Blood Press.</p>
                          <p className="font-extrabold text-slate-800 text-lg">{v.bloodPressure || '--'}</p>
                        </div>
                        <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                          <p className="text-xs text-red-500 flex items-center gap-1 mb-1"><Activity size={14}/> Heart Rate</p>
                          <p className={`font-extrabold text-lg ${getStatusColor('hr', v.heartRate)}`}>{v.heartRate || '--'} bpm</p>
                        </div>
                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                          <p className="text-xs text-amber-500 flex items-center gap-1 mb-1"><Thermometer size={14}/> Temp</p>
                          <p className={`font-extrabold text-lg ${getStatusColor('temp', v.temperature)}`}>{v.temperature || '--'} °C</p>
                        </div>
                        <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                          <p className="text-xs text-sky-500 flex items-center gap-1 mb-1"><Droplets size={14}/> SpO2</p>
                          <p className={`font-extrabold text-lg ${getStatusColor('spo2', v.spo2)}`}>{v.spo2 || '--'} %</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Activity size={64} className="mb-4 text-slate-300" />
            <p className="font-bold text-xl text-slate-500">Select a Patient</p>
            <p className="text-sm mt-2 max-w-sm">Choose a patient from the list on the left to view their vitals history or log new readings.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Patient Vitals">
        {selectedPatient && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <span className="text-sm text-slate-500 block">Logging for:</span>
              <span className="font-bold text-slate-800 text-lg">{selectedPatient.patientName}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Blood Pressure (mmHg)</label>
                <input required type="text" className="input-field" placeholder="120/80" value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Heart Rate (bpm)</label>
                <input required type="number" className="input-field" placeholder="72" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Temperature (°C)</label>
                <input required type="number" step="0.1" className="input-field" placeholder="36.5" value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">SpO2 (%)</label>
                <input required type="number" className="input-field" placeholder="98" value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} />
              </div>
            </div>
            
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 py-3">
              {isSubmitting ? 'Saving...' : 'Save Vitals'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default VitalsMonitoring;
