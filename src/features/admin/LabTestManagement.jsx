import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TestTube2, Search, Plus, X, CheckCircle2, Clock, FileText, AlertCircle, Upload } from 'lucide-react';

const LabTestManagement = () => {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // pending, processing, completed
  
  const fileInputRef = useRef(null);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);

  const hospitalId = localStorage.getItem('hospitalId');

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    testName: '',
    testType: 'Blood Test',
    priority: 'Routine',
    doctorName: '',
    notes: ''
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'lab_orders'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      // Sort by priority and date
      records.sort((a, b) => {
        if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
        if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
        return (b.date?.toDate() || 0) - (a.date?.toDate() || 0);
      });
      setLabOrders(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'lab_orders'), {
        ...formData,
        hospitalId,
        status: 'pending',
        date: serverTimestamp(),
        resultLink: null
      });
      setIsModalOpen(false);
      setFormData({
        patientName: '', patientId: '', testName: '', testType: 'Blood Test', priority: 'Routine', doctorName: '', notes: ''
      });
    } catch (error) {
      console.error("Error creating lab order:", error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'lab_orders', id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleFileUploadClick = (orderId) => {
    setUploadingOrderId(orderId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingOrderId) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateDoc(doc(db, 'lab_orders', uploadingOrderId), {
          status: 'completed',
          resultLink: reader.result
        });
        setUploadingOrderId(null);
        e.target.value = null;
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = ((order.patientName || "").toLowerCase().includes(searchTerm.toLowerCase())) || 
                          ((order.testName || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-sky-100 text-sky-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lab & Diagnostics</h1>
          <p className="text-slate-500 mt-1">Manage test orders, track sample processing, and upload results.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={20} /> Order Lab Test
        </button>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Patient or Test Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {['pending', 'processing', 'completed', 'all'].map(status => (
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
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
              <TestTube2 size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-lg text-slate-700">No lab orders found</p>
              <p className="text-sm text-slate-500 mt-1">Adjust filters or create a new test order.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-sky-200 transition-colors">
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.priority === 'Urgent' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                      <TestTube2 size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 text-lg">{order.testName}</h3>
                        {order.priority === 'Urgent' && (
                          <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10}/> Urgent</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1"><span className="font-medium text-slate-800">{order.patientName}</span> (ID: {order.patientId || 'Walk-in'})</p>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <span>Ordered by: Dr. {order.doctorName}</span>
                        <span>Type: {order.testType}</span>
                        <span>{new Date(order.date?.toDate()).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:ml-auto md:border-l md:border-slate-100 md:pl-6">
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      
                      {order.status === 'pending' && (
                        <button onClick={() => updateStatus(order.id, 'processing')} className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors">
                          Mark as Processing →
                        </button>
                      )}
                      
                      {order.status === 'processing' && (
                        <button onClick={() => handleFileUploadClick(order.id)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                          <Upload size={14}/> Upload Results
                        </button>
                      )}

                      {order.status === 'completed' && order.resultLink && (
                        <button onClick={() => {
                          const w = window.open();
                          w.document.write(`<iframe src="${order.resultLink}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                          <FileText size={14}/> View Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
        </div>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Order Lab Test</h2>
                  <p className="text-sm text-slate-500">Create a new diagnostic request.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Test Name</label>
                    <input type="text" name="testName" required value={formData.testName} onChange={handleChange} className="input-field" placeholder="e.g. Complete Blood Count (CBC)" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Test Type</label>
                    <select name="testType" value={formData.testType} onChange={handleChange} className="input-field font-bold text-slate-700">
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI/CT Scan">MRI/CT Scan</option>
                      <option value="Pathology">Pathology</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="input-field font-bold text-slate-700">
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent (STAT)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Patient Name</label>
                    <input type="text" name="patientName" required value={formData.patientName} onChange={handleChange} className="input-field" placeholder="Full Name" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Patient ID (Optional)</label>
                    <input type="text" name="patientId" value={formData.patientId} onChange={handleChange} className="input-field" placeholder="e.g. PT-1002" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Ordering Doctor</label>
                    <input type="text" name="doctorName" required value={formData.doctorName} onChange={handleChange} className="input-field" placeholder="Doctor's Name" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Clinical Notes (Optional)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Specific instructions for the lab..."></textarea>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <TestTube2 size={18} />
                    Place Order
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

export default LabTestManagement;
