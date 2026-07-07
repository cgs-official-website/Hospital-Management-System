import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Plus, Search, FileText, CheckCircle2, Clock, XCircle, IndianRupee } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { showPopup } from '../../utils/popup';

const InsuranceClaim = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    provider: '',
    policyNumber: '',
    claimAmount: '',
    description: ''
  });

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'insurance_claims'), where('hospitalId', '==', hospitalId));
    
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClaims(records.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.provider || !formData.claimAmount) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'insurance_claims'), {
        hospitalId,
        ...formData,
        claimAmount: parseFloat(formData.claimAmount),
        status: 'Submitted',
        date: serverTimestamp()
      });
      
      showPopup("Insurance claim submitted successfully", "success");
      setFormData({ patientName: '', provider: '', policyNumber: '', claimAmount: '', description: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to submit claim", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'insurance_claims', id), {
        status,
        lastUpdated: serverTimestamp()
      });
      showPopup(`Claim marked as ${status}`, "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to update status", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Approved</span>;
      case 'Rejected':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={12}/> Rejected</span>;
      default:
        return <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12}/> Submitted</span>;
    }
  };

  const filteredClaims = claims.filter(c => 
    c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Insurance Claims</h2>
          <p className="text-sm text-slate-500">File and track patient insurance claims.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patient or provider..." 
              className="input-field pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <Plus size={18} /> File Claim
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
            <ShieldCheck size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-700">No Claims Found</p>
            <p className="text-sm text-slate-500 mt-1">Submit a new insurance claim to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 xl:grid-cols-1 md:grid-cols-3 gap-4">
            {filteredClaims.map(claim => (
              <div key={claim.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <FileText size={12}/> {claim.date ? new Date(claim.date.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                    <h3 className="font-bold text-slate-800 text-lg truncate max-w-[180px]">{claim.patientName}</h3>
                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">{claim.provider}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(claim.status)}
                    <p className="text-xl font-extrabold text-slate-800 mt-2 flex items-center justify-end">
                      <IndianRupee size={16}/> {claim.claimAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 mb-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-bold text-slate-700">Policy:</span> {claim.policyNumber || 'N/A'}</p>
                  <p><span className="font-bold text-slate-700">Description:</span> {claim.description || 'N/A'}</p>
                </div>

                {claim.status === 'Submitted' && (
                  <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-slate-100">
                    <button onClick={() => updateStatus(claim.id, 'Rejected')} className="btn-secondary py-1.5 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                      Reject
                    </button>
                    <button onClick={() => updateStatus(claim.id, 'Approved')} className="btn-secondary py-1.5 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300">
                      Approve
                    </button>
                  </div>
                )}
                {claim.status !== 'Submitted' && (
                  <div className="mt-auto pt-4 border-t border-slate-100 text-right text-xs text-slate-400">
                    Updated: {claim.lastUpdated ? new Date(claim.lastUpdated.seconds * 1000).toLocaleDateString() : 'Recently'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File Insurance Claim">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Patient Name</label>
            <input required type="text" className="input-field" placeholder="Full Name" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Insurance Provider</label>
              <input required type="text" className="input-field" placeholder="e.g. Star Health, HDFC" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Policy Number</label>
              <input required type="text" className="input-field" placeholder="POL-XXXXX" value={formData.policyNumber} onChange={e => setFormData({...formData, policyNumber: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Claim Amount (₹)</label>
            <input required type="number" min="0" step="0.01" className="input-field font-bold text-lg" placeholder="0.00" value={formData.claimAmount} onChange={e => setFormData({...formData, claimAmount: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Diagnosis / Treatment Description</label>
            <textarea required className="input-field min-h-[80px]" placeholder="Brief description for the claim..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 py-3">
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default InsuranceClaim;
