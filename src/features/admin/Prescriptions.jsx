import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Search, User, FileText, Pill, Save, CheckCircle2, X, Plus } from 'lucide-react';

const Prescriptions = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const hospitalId = localStorage.getItem('hospitalId');
  const doctorName = "Dr. Jane Smith"; // Ideally fetched from current user profile

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    subjective: '', // Symptoms
    objective: '',  // Vitals/Observation
    assessment: '', // Diagnosis
    plan: '',       // Instructions
    medications: [] // Array of { name, dosage, frequency, duration }
  });

  const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', frequency: '', duration: '' });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'consultations'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      setConsultations(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMedChange = (e) => {
    setCurrentMed({ ...currentMed, [e.target.name]: e.target.value });
  };

  const addMedication = () => {
    if (currentMed.name && currentMed.dosage) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, currentMed]
      }));
      setCurrentMed({ name: '', dosage: '', frequency: '', duration: '' });
    }
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'consultations'), {
        ...formData,
        doctorName,
        hospitalId,
        status: 'completed',
        date: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({
        patientName: '', patientId: '', subjective: '', objective: '', assessment: '', plan: '', medications: []
      });
    } catch (error) {
      console.error("Error saving consultation:", error);
    }
  };

  const filteredConsultations = consultations.filter(c => 
    ((c.patientName || "").toLowerCase().includes(searchTerm.toLowerCase())) || 
    ((c.patientId || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Doctor Consultation</h1>
          <p className="text-slate-500 mt-1">Manage patient visits, SOAP notes, and prescriptions.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Stethoscope size={20} /> New Consultation
        </button>
      </div>

      <div className="glass-panel p-6 flex flex-col">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Patient Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-lg text-slate-700">No consultation records found</p>
              <p className="text-sm text-slate-500 mt-1">Click "New Consultation" to start a patient visit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 gap-6">
              {filteredConsultations.map((record) => (
                <div key={record.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-indigo-700">
                        {record.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{record.patientName}</h3>
                        <p className="text-xs font-medium text-slate-500">ID: {record.patientId || 'Walk-in'} • {new Date(record.date?.toDate()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Consulting Dr.</p>
                      <p className="text-sm font-bold text-slate-700">{record.doctorName}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis (Assessment)</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{record.assessment || 'No diagnosis recorded.'}</p>
                    </div>

                    {record.medications && record.medications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Pill size={12}/> Prescriptions</h4>
                        <div className="space-y-2">
                          {record.medications.map((med, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-sky-50/50 border border-sky-100 p-2.5 rounded-xl text-sm">
                              <div>
                                <p className="font-bold text-slate-800">{med.name}</p>
                                <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                              </div>
                              <span className="text-xs font-bold text-primary bg-sky-100 px-2 py-1 rounded-lg">{med.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <button className="text-sm font-bold text-primary hover:text-sky-600 transition-colors flex items-center gap-1">
                      View Full File <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Consultation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">New Clinical Consultation</h2>
                  <p className="text-sm text-slate-500">Record patient visit and prescribe medications.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="consultationForm" onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Patient Info */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={16} className="text-primary"/> Patient Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Patient Name</label>
                        <input type="text" name="patientName" required value={formData.patientName} onChange={handleChange} className="input-field" placeholder="Full Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Patient ID (Optional)</label>
                        <input type="text" name="patientId" value={formData.patientId} onChange={handleChange} className="input-field" placeholder="e.g. PT-1005" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  {/* SOAP Notes */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-primary"/> Clinical Notes (SOAP)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Subjective (Symptoms)</label>
                        <textarea name="subjective" value={formData.subjective} onChange={handleChange} className="input-field min-h-[100px] py-3" placeholder="Patient's complaints..."></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Objective (Observations)</label>
                        <textarea name="objective" value={formData.objective} onChange={handleChange} className="input-field min-h-[100px] py-3" placeholder="Physical examination findings..."></textarea>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Assessment (Diagnosis)</label>
                        <input type="text" name="assessment" required value={formData.assessment} onChange={handleChange} className="input-field font-medium text-indigo-700" placeholder="Primary Diagnosis" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Plan (Instructions)</label>
                        <textarea name="plan" value={formData.plan} onChange={handleChange} className="input-field py-3" placeholder="Follow-up instructions, lifestyle changes..."></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  {/* E-Prescription */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Pill size={16} className="text-primary"/> E-Prescription
                    </h3>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                          <input type="text" name="name" value={currentMed.name} onChange={handleMedChange} className="input-field bg-white py-2.5 text-sm" placeholder="Medicine Name (e.g. Amoxicillin)" />
                        </div>
                        <div>
                          <input type="text" name="dosage" value={currentMed.dosage} onChange={handleMedChange} className="input-field bg-white py-2.5 text-sm" placeholder="Dosage (500mg)" />
                        </div>
                        <div>
                          <input type="text" name="frequency" value={currentMed.frequency} onChange={handleMedChange} className="input-field bg-white py-2.5 text-sm" placeholder="Frequency (1-0-1)" />
                        </div>
                        <div className="flex gap-2">
                          <input type="text" name="duration" value={currentMed.duration} onChange={handleMedChange} className="input-field bg-white py-2.5 text-sm" placeholder="Duration (5 Days)" />
                          <button type="button" onClick={addMedication} className="bg-primary hover:bg-sky-500 text-white p-2.5 rounded-xl shadow-sm transition-colors">
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {formData.medications.length > 0 ? (
                      <div className="space-y-2">
                        {formData.medications.map((med, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-primary flex items-center justify-center">
                                <Pill size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{med.name} <span className="text-slate-500 font-normal">({med.dosage})</span></p>
                                <p className="text-xs text-slate-500">{med.frequency} for {med.duration}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeMedication(idx)} className="text-slate-400 hover:text-red-500 p-2">
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-sm">No medications prescribed yet.</p>
                      </div>
                    )}
                  </div>

                </form>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Discard
                </button>
                <button type="submit" form="consultationForm" className="btn-primary">
                  <CheckCircle2 size={18} />
                  Save Consultation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple ChevronRight icon component since it wasn't imported at top
const ChevronRight = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default Prescriptions;
