import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FileText, Search, Plus, User, Clock, CheckCircle2, AlertCircle, FileEdit } from 'lucide-react';
import { showPopup } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const NurseNotes = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: 'General',
    content: ''
  });

  // Fetch admitted patients
  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  // Fetch notes for selected patient
  useEffect(() => {
    if (!selectedPatient || !hospitalId) {
      setNotes([]);
      return;
    }

    const q = query(
      collection(db, 'nurse_notes'), 
      where('hospitalId', '==', hospitalId),
      where('admissionId', '==', selectedPatient.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(records.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
    });

    return () => unsub();
  }, [selectedPatient, hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !formData.content.trim()) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'nurse_notes'), {
        hospitalId,
        admissionId: selectedPatient.id,
        patientName: selectedPatient.patientName,
        category: formData.category,
        content: formData.content,
        date: serverTimestamp(),
        author: 'Nurse User' // from auth context normally
      });
      showPopup("Note added successfully", "success");
      setFormData({ category: 'General', content: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to add note", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Incident': return 'bg-red-100 text-red-700 border-red-200';
      case 'Progress': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Care Plan': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Incident': return <AlertCircle size={14} />;
      case 'Progress': return <CheckCircle2 size={14} />;
      case 'Care Plan': return <FileEdit size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const filteredPatients = patients.filter(p => p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left: Patient List */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Nurse Notes</h2>
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
                <p className="text-xs text-slate-500">Bed: {p.bedNumber} • ID: {p.patientId || 'N/A'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Notes Dashboard */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.patientName}</h2>
                <p className="text-sm text-slate-500">Bed: {selectedPatient.bedNumber} | Dep: {selectedPatient.department}</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus size={18} /> Add Note
              </button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg">No Clinical Notes</p>
                  <p className="text-sm mt-1">Click "Add Note" to record observations or care plan updates.</p>
                </div>
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {notes.map(note => (
                    <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {getCategoryIcon(note.category)}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${getCategoryStyles(note.category)}`}>
                            {note.category}
                          </span>
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={12}/> {note.date ? new Date(note.date.seconds * 1000).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <User size={12} /> {note.author}
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
            <FileEdit size={64} className="mb-4 text-slate-300" />
            <p className="font-bold text-xl text-slate-500">Select a Patient</p>
            <p className="text-sm mt-2 max-w-sm">Choose a patient from the list on the left to view their clinical timeline or add new notes.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Clinical Note">
        {selectedPatient && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <span className="text-sm text-slate-500 block">Adding note for:</span>
              <span className="font-bold text-slate-800 text-lg">{selectedPatient.patientName}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="General">General Observation</option>
                <option value="Progress">Progress Note</option>
                <option value="Care Plan">Care Plan Update</option>
                <option value="Incident">Incident Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Note Content</label>
              <textarea 
                required 
                className="input-field min-h-[150px]" 
                placeholder="Enter clinical observations, handover details, etc..."
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
              />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 py-3">
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default NurseNotes;
