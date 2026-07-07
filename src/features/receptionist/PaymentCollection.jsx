import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CreditCard, Plus, Search, CheckCircle2, AlertCircle, FileText, IndianRupee } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { showPopup } from '../../utils/popup';

const PaymentCollection = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    description: '',
    amount: ''
  });

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'reception_bills'), where('hospitalId', '==', hospitalId));
    
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by newest first
      setBills(records.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.amount) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'reception_bills'), {
        hospitalId,
        patientName: formData.patientName,
        description: formData.description || 'General Service',
        amount: parseFloat(formData.amount),
        status: 'Pending',
        date: serverTimestamp(),
        issuedBy: 'Receptionist'
      });
      
      showPopup("Bill generated successfully", "success");
      setFormData({ patientName: '', description: '', amount: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to generate bill", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      await updateDoc(doc(db, 'reception_bills', id), {
        status: 'Paid',
        paidAt: serverTimestamp()
      });
      showPopup("Payment collected successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to process payment", "error");
    }
  };

  const filteredBills = bills.filter(b => 
    ((b.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingTotal = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.amount || 0), 0);
  const collectedTotal = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Payments & Billing</h2>
          <p className="text-sm text-slate-500">Manage patient invoices and collect payments.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patient..." 
              className="input-field pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <Plus size={18} /> Generate Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">Pending Collections</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 flex items-center"><IndianRupee size={20}/> {pendingTotal.toFixed(2)}</p>
          </div>
          <AlertCircle size={28} className="text-orange-400 opacity-50" />
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Total Collected</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 flex items-center"><IndianRupee size={20}/> {collectedTotal.toFixed(2)}</p>
          </div>
          <CheckCircle2 size={28} className="text-emerald-500 opacity-50" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
            <CreditCard size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-700">No Bills Found</p>
            <p className="text-sm text-slate-500 mt-1">Generate a new bill to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBills.map(bill => (
              <div key={bill.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${bill.status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-400'}`}></div>
                
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div className="pl-3">
                    <p className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <FileText size={12}/> {bill.date ? new Date(bill.date.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                    <h3 className="font-bold text-slate-800 text-lg">{bill.patientName}</h3>
                    <p className="text-sm text-slate-500 mt-1">{bill.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                      bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {bill.status === 'Paid' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>} 
                      {bill.status}
                    </span>
                    <p className="text-2xl font-extrabold text-slate-800 mt-2 flex items-center justify-end">
                      <IndianRupee size={18}/> {bill.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {bill.status === 'Pending' && (
                  <div className="flex justify-end">
                    <button onClick={() => markAsPaid(bill.id)} className="btn-primary py-2 text-sm flex items-center gap-2">
                      <CreditCard size={16}/> Collect Payment
                    </button>
                  </div>
                )}
                {bill.status === 'Paid' && (
                  <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-500 flex justify-between items-center pl-3">
                    <span>Issued by: {bill.issuedBy}</span>
                    <span>Paid on: {bill.paidAt ? new Date(bill.paidAt.seconds * 1000).toLocaleDateString() : 'Today'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate New Bill">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Patient Name</label>
            <input required type="text" className="input-field" placeholder="Full Name" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Description of Service</label>
            <input required type="text" className="input-field" placeholder="e.g. Initial Consultation, Lab Test" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Amount (₹)</label>
            <input required type="number" min="0" step="0.01" className="input-field font-bold text-lg" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 py-3">
            {isSubmitting ? 'Generating...' : 'Generate Bill'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentCollection;
