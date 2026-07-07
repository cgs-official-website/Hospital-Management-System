import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { showConfirm } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Search, Plus, X, CheckCircle2, FileText, IndianRupee, Printer, AlertCircle } from 'lucide-react';

const HospitalBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('unpaid'); // unpaid, paid, all
  
  const hospitalId = localStorage.getItem('hospitalId');

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    type: 'Consultation',
    amount: '',
    description: '',
    paymentMethod: 'Cash'
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'invoices'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      records.sort((a, b) => (b.date?.toDate() || 0) - (a.date?.toDate() || 0));
      setInvoices(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invoices'), {
        ...formData,
        hospitalId,
        amount: parseFloat(formData.amount),
        status: 'unpaid',
        date: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({
        patientName: '', patientId: '', type: 'Consultation', amount: '', description: '', paymentMethod: 'Cash'
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const markAsPaid = async (id, method) => {
    showConfirm(`Mark this invoice as Paid via ${method}?`, async () => {
      try {
        await updateDoc(doc(db, 'invoices', id), { status: 'Paid', paymentMethod: method });
      } catch (error) {
        console.error("Error updating invoice: ", error);
      }
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Billing & Invoicing</h1>
          <p className="text-slate-500 mt-1">Manage patient invoices, collect payments, and track revenue.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={20} /> Generate Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="glass-panel p-6 flex items-center justify-between border-b-4 border-b-emerald-500">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-3xl font-extrabold text-slate-800 flex items-center">
              <IndianRupee size={24} className="mr-1 text-slate-400"/>
              {totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center justify-between border-b-4 border-b-amber-500">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Dues</p>
            <p className="text-3xl font-extrabold text-slate-800 flex items-center">
              <IndianRupee size={24} className="mr-1 text-slate-400"/>
              {pendingAmount.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col overflow-hidden">
        
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
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {['unpaid', 'paid', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterStatus === status ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Patient Details</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Bill Summary</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Amount</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Status</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-lg">No invoices found</p>
                    <p className="text-sm">Click "Generate Invoice" to bill a patient.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-800">{inv.patientName}</p>
                        <p className="text-xs text-slate-500">ID: {inv.patientId || 'Walk-in'} • {new Date(inv.date?.toDate()).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{inv.type}</span>
                        <p className="text-sm text-slate-500 mt-1 truncate max-w-[200px]" title={inv.description}>{inv.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-slate-800 flex items-center text-lg">
                        <IndianRupee size={16} className="text-slate-400 mr-0.5" />
                        {inv.amount?.toLocaleString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                      {inv.status === 'paid' && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Via {inv.paymentMethod}</p>}
                    </td>
                    <td className="p-4 text-right">
                      {inv.status === 'unpaid' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => markAsPaid(inv.id, 'Cash')} className="text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors border border-emerald-200">
                            Cash
                          </button>
                          <button onClick={() => markAsPaid(inv.id, 'Card/UPI')} className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors border border-indigo-200">
                            Card/UPI
                          </button>
                        </div>
                      ) : (
                        <button className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-end gap-1 w-full">
                          <Printer size={16}/> Print Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Generate Invoice</h2>
                  <p className="text-sm text-slate-500">Bill patient for services rendered.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGenerateInvoice} className="p-6 space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Patient Name</label>
                    <input type="text" name="patientName" required value={formData.patientName} onChange={handleChange} className="input-field" placeholder="Full Name" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Patient ID (Optional)</label>
                    <input type="text" name="patientId" value={formData.patientId} onChange={handleChange} className="input-field" placeholder="e.g. PT-1002" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Bill Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input-field font-bold text-slate-700">
                      <option value="Consultation">Consultation Fee</option>
                      <option value="Lab Test">Lab Test</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="IPD Admission">IPD Admission</option>
                      <option value="Procedure/Surgery">Procedure/Surgery</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="number" name="amount" required value={formData.amount} onChange={handleChange} className="input-field pl-12" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Description / Breakdown</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Specific details of charges..."></textarea>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <FileText size={18} />
                    Create Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalBilling;
