import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, UserPlus, LogOut, Search, Clock, CheckCircle2, User } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { showPopup } from '../../utils/popup';

const VisitorManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  
  const [visitors, setVisitors] = useState([]);
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorContact: '',
    patientId: '',
    relation: ''
  });

  // Fetch active visitors
  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'visitors'), where('hospitalId', '==', hospitalId), where('status', '==', 'Active'));
    
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisitors(records.sort((a, b) => (b.checkIn?.seconds || 0) - (a.checkIn?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId]);

  // Fetch currently admitted patients for the select dropdown
  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setAdmittedPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.patientId) return;
    setIsSubmitting(true);
    
    try {
      const patient = admittedPatients.find(p => p.id === formData.patientId);
      
      await addDoc(collection(db, 'visitors'), {
        hospitalId,
        visitorName: formData.visitorName,
        visitorContact: formData.visitorContact,
        relation: formData.relation || 'Guest',
        patientId: formData.patientId,
        patientName: patient?.patientName || 'Unknown',
        patientBed: patient?.bedNumber || 'Unknown',
        status: 'Active',
        checkIn: serverTimestamp()
      });
      
      showPopup("Visitor checked in successfully", "success");
      setFormData({ visitorName: '', visitorContact: '', patientId: '', relation: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to check in visitor", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await updateDoc(doc(db, 'visitors', id), {
        status: 'Checked Out',
        checkOut: serverTimestamp()
      });
      showPopup("Visitor checked out", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to check out visitor", "error");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visitor Management</h2>
          <p className="text-sm text-slate-500">Track and manage guests visiting admitted patients.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search visitor or patient..." 
              className="input-field pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <UserPlus size={18} /> Check-In Visitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-sky-600 uppercase tracking-widest">Active Visitors Inside</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{visitors.length}</p>
          </div>
          <Users size={32} className="text-sky-400 opacity-50" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6 pb-6">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        ) : filteredVisitors.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <User size={64} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-xl text-slate-600">No Active Visitors</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">There are currently no active visitors in the hospital. Click Check-In to add a new guest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-4">
            {filteredVisitors.map(visitor => (
              <div key={visitor.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <User size={16} className="text-primary"/> {visitor.visitorName}
                    </h3>
                    <p className="text-sm text-slate-500">{visitor.relation} • {visitor.visitorContact}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12}/> Inside
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Visiting Patient</p>
                  <p className="font-bold text-slate-700">{visitor.patientName}</p>
                  <p className="text-sm text-slate-500">Bed: {visitor.patientBed}</p>
                </div>

                <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Clock size={12}/> In: {visitor.checkIn ? new Date(visitor.checkIn.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                  </p>
                  <button onClick={() => handleCheckOut(visitor.id)} className="btn-secondary py-1.5 px-3 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300 flex items-center gap-1">
                    <LogOut size={14} /> Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Check-In Visitor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Visitor Name</label>
            <input required type="text" className="input-field" placeholder="Full Name" value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Contact Number</label>
              <input required type="text" className="input-field" placeholder="Phone" value={formData.visitorContact} onChange={e => setFormData({...formData, visitorContact: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Relation to Patient</label>
              <input required type="text" className="input-field" placeholder="e.g. Spouse, Friend" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Visiting Patient</label>
            <select required className="input-field font-medium text-slate-700" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
              <option value="">-- Select Admitted Patient --</option>
              {admittedPatients.length === 0 && <option disabled>No patients currently admitted</option>}
              {admittedPatients.map(p => (
                <option key={p.id} value={p.id}>{p.patientName} (Bed {p.bedNumber})</option>
              ))}
            </select>
          </div>
          
          <button type="submit" disabled={isSubmitting || admittedPatients.length === 0} className="btn-primary w-full mt-4 py-3">
            {isSubmitting ? 'Checking in...' : 'Confirm Check-In'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default VisitorManagement;
