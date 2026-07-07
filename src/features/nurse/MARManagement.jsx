import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Pill, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { showPopup } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const MARManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [medications, setMedications] = useState([]);
  const [marLogs, setMarLogs] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch admitted patients
  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  // Fetch patient's active prescriptions (from consultations) and MAR logs
  useEffect(() => {
    if (!selectedPatient || !hospitalId) {
      setMedications([]);
      setMarLogs([]);
      return;
    }

    // 1. Fetch medications from consultations for this patient
    // Note: We use patientName for matching here if patientId isn't reliable in demo, 
    // ideally we should match by a unique patient document reference.
    const consQ = query(
      collection(db, 'consultations'), 
      where('hospitalId', '==', hospitalId),
      where('patientName', '==', selectedPatient.patientName) // Approximation for demo
    );
    
    const unsubCons = onSnapshot(consQ, (snap) => {
      let meds = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.medications && data.medications.length > 0) {
          data.medications.forEach(m => {
            meds.push({ ...m, consultationId: doc.id, doctorName: data.doctorName });
          });
        }
      });
      setMedications(meds);
    });

    // 2. Fetch MAR logs for this admission
    const marQ = query(
      collection(db, 'mar_logs'), 
      where('hospitalId', '==', hospitalId),
      where('admissionId', '==', selectedPatient.id)
    );

    const unsubMar = onSnapshot(marQ, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarLogs(logs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
    });

    return () => {
      unsubCons();
      unsubMar();
    };
  }, [selectedPatient, hospitalId]);

  const handleOpenAdminister = (med) => {
    setSelectedMed(med);
    setAdminNotes('');
    setIsModalOpen(true);
  };

  const handleAdminister = async (e) => {
    e.preventDefault();
    if (!selectedMed || !selectedPatient) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'mar_logs'), {
        hospitalId,
        admissionId: selectedPatient.id,
        patientName: selectedPatient.patientName,
        medicineName: selectedMed.name,
        dosage: selectedMed.dosage,
        notes: adminNotes,
        date: serverTimestamp(),
        administeredBy: 'Nurse User' // Normally pulled from auth
      });
      showPopup("Medication administration logged successfully", "success");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to log MAR", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left: Patient List */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">MAR Patients</h2>
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
                <p className="text-xs text-slate-500">Bed: {p.bedNumber}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: MAR Dashboard */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.patientName}</h2>
              <p className="text-sm text-slate-500">Medication Administration Record</p>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-8">
              
              {/* Prescribed Medications Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Pill size={20} className="text-primary"/> Active Prescriptions
                </h3>
                
                {medications.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500">
                    No active prescriptions found for this patient.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{med.name}</p>
                          <p className="text-sm text-slate-600 font-medium">Dosage: {med.dosage} • Freq: {med.frequency}</p>
                          <p className="text-xs text-slate-500 mt-1">Prescribed by Dr. {med.doctorName}</p>
                        </div>
                        <button onClick={() => handleOpenAdminister(med)} className="btn-primary py-2 px-4 text-sm whitespace-nowrap">
                          Log Dose
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MAR Logs Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-emerald-500"/> Administration Log
                </h3>
                
                {marLogs.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500">
                    No doses have been logged yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {marLogs.map(log => (
                      <div key={log.id} className="bg-white border border-emerald-100 bg-emerald-50/30 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800">{log.medicineName}</p>
                              <p className="text-sm text-slate-600">{log.dosage}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                              {log.date ? new Date(log.date.seconds * 1000).toLocaleString() : 'Just now'}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-white p-2 border border-slate-100 rounded">Note: {log.notes}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">Administered by {log.administeredBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Pill size={64} className="mb-4 text-slate-300" />
            <p className="font-bold text-xl text-slate-500">Select a Patient</p>
            <p className="text-sm mt-2 max-w-sm">Choose a patient from the list on the left to view and manage their Medication Administration Record.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Medication Administration">
        {selectedMed && (
          <form onSubmit={handleAdminister} className="space-y-4">
            <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 mb-4">
              <p className="text-sm text-sky-600 font-bold uppercase tracking-widest mb-1">Medication Details</p>
              <p className="font-extrabold text-slate-800 text-lg">{selectedMed.name}</p>
              <p className="text-slate-700 font-medium">{selectedMed.dosage}</p>
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-1"><AlertCircle size={14}/> Frequency: {selectedMed.frequency}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Administration Notes (Optional)</label>
              <textarea 
                className="input-field min-h-[80px]" 
                placeholder="E.g., Patient took it with water, slightly delayed..." 
                value={adminNotes} 
                onChange={e => setAdminNotes(e.target.value)} 
              />
            </div>
            
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex items-start gap-2 mt-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>By confirming, you are verifying that you have administered the correct dose to the correct patient at this exact time.</p>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 py-3">
              {isSubmitting ? 'Logging...' : 'Confirm Administration'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MARManagement;
