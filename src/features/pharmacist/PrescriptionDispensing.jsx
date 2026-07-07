import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Pill, CheckCircle2, Search, FileText, AlertCircle } from 'lucide-react';
import { showPopup, showConfirm } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const PrescriptionDispensing = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    if (!hospitalId) return;
    // We fetch consultations that have a status, and are from this hospital
    const q = query(collection(db, 'consultations'), where('hospitalId', '==', hospitalId));
    
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter locally for those with medications
      const withMeds = records.filter(r => r.medications && r.medications.length > 0);
      setPrescriptions(withMeds.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, [hospitalId]);

  const handleOpenDispense = (record) => {
    setSelectedPrescription(record);
    setIsModalOpen(true);
  };

  const handleDispense = async () => {
    setDispensing(true);
    try {
      // 1. Deduct from inventory (Basic implementation matching by name)
      for (const med of selectedPrescription.medications) {
        // Query inventory for this medicine name
        const invQ = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId), where('name', '==', med.name));
        const invSnap = await getDocs(invQ);
        
        if (!invSnap.empty) {
          const invDoc = invSnap.docs[0];
          const currentStock = invDoc.data().stock || 0;
          
          // Try to parse quantity from duration/frequency or default to 10 for demo if not parsable
          let qtyToDeduct = 10; 
          
          await updateDoc(doc(db, 'inventory', invDoc.id), {
            stock: Math.max(0, currentStock - qtyToDeduct)
          });
        }
      }

      // 2. Mark as dispensed
      await updateDoc(doc(db, 'consultations', selectedPrescription.id), {
        dispensed: true,
        dispensedAt: new Date()
      });

      showPopup("Prescription dispensed successfully!", "success");
      setIsModalOpen(false);
      setSelectedPrescription(null);
    } catch (error) {
      console.error("Error dispensing:", error);
      showPopup("Failed to dispense prescription", "error");
    } finally {
      setDispensing(false);
    }
  };

  const filtered = prescriptions.filter(p => 
    ((p.patientName || "").toLowerCase().includes(searchTerm.toLowerCase())) || 
    ((p.patientId || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Prescription Dispensing</h2>
          <p className="text-sm text-slate-500">View and fulfill doctor prescriptions.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Patient Name or ID..." 
            className="input-field pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-700">No Prescriptions Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(record => (
              <div key={record.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-700">
                      {record.patientName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{record.patientName}</h3>
                      <p className="text-xs text-slate-500">ID: {record.patientId || 'Walk-in'} • Dr. {record.doctorName}</p>
                    </div>
                  </div>
                  <div>
                    {record.dispensed ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Dispensed
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={14} /> Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {record.medications.map((med, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-sm">
                      <span className="font-bold text-slate-700 flex items-center gap-2"><Pill size={14} className="text-slate-400"/> {med.name}</span>
                      <span className="text-slate-500">{med.dosage} • {med.frequency} • {med.duration}</span>
                    </div>
                  ))}
                </div>

                {!record.dispensed && (
                  <button onClick={() => handleOpenDispense(record)} className="w-full btn-primary py-2 text-sm">
                    Dispense Medications
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Dispensing">
        {selectedPrescription && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Patient:</p>
              <p className="font-bold text-slate-800 text-lg">{selectedPrescription.patientName}</p>
            </div>
            
            <div>
              <p className="font-bold text-slate-700 mb-2">Medications to Dispense:</p>
              <ul className="space-y-2">
                {selectedPrescription.medications.map((med, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-sky-50 p-2 rounded">
                    <CheckCircle2 size={16} className="text-primary" /> {med.name} ({med.dosage})
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex items-start gap-2 mt-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Confirming this action will mark the prescription as fulfilled and deduct the required quantities from your inventory.</p>
            </div>

            <button onClick={handleDispense} disabled={dispensing} className="w-full btn-primary py-3 mt-2">
              {dispensing ? 'Processing...' : 'Confirm & Dispense'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrescriptionDispensing;
