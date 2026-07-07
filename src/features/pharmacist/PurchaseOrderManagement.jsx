import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, FileText, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { showPopup } from '../../utils/popup';

const PurchaseOrderManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierEmail: '',
    notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState({ medicineName: '', quantity: '', expectedPrice: '' });

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'purchase_orders'), where('hospitalId', '==', hospitalId));
    const unsub = onSnapshot(q, (snap) => {
      setPurchaseOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [hospitalId]);

  const handleItemChange = (e) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const addItem = () => {
    if (currentItem.medicineName && currentItem.quantity) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...currentItem, quantity: parseInt(currentItem.quantity), expectedPrice: parseFloat(currentItem.expectedPrice || 0) }]
      }));
      setCurrentItem({ medicineName: '', quantity: '', expectedPrice: '' });
    }
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      showPopup("Please add at least one item to the PO", "error");
      return;
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.expectedPrice), 0);

    try {
      await addDoc(collection(db, 'purchase_orders'), {
        ...formData,
        hospitalId,
        totalAmount,
        status: 'Pending',
        date: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ supplierName: '', supplierEmail: '', notes: '', items: [] });
      showPopup("Purchase Order created successfully!", "success");
    } catch (error) {
      console.error("Error creating PO:", error);
      showPopup("Failed to create PO", "error");
    }
  };

  const markAsReceived = async (id) => {
    try {
      await updateDoc(doc(db, 'purchase_orders', id), { status: 'Received' });
      showPopup("PO marked as Received", "success");
    } catch(err) {
      showPopup("Failed to update status", "error");
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Manage medicine orders to suppliers.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search supplier..." 
              className="input-field pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <Plus size={18} /> New PO
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : filteredPOs.length === 0 ? (
          <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
            <ShoppingCart size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-lg text-slate-700">No Purchase Orders Found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPOs.map(po => (
              <div key={po.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{po.supplierName}</h3>
                    <p className="text-sm text-slate-500">{po.supplierEmail} • {new Date(po.date?.toDate()).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                      po.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {po.status === 'Received' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {po.status}
                    </span>
                    <p className="font-extrabold text-slate-700 mt-2">₹{po.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 mb-3">
                  <span className="font-bold text-slate-800">Items: </span>
                  {po.items?.map((item, idx) => (
                    <span key={idx} className="inline-block bg-slate-100 rounded px-2 py-1 mr-2 mb-2 text-xs">
                      {item.medicineName} (x{item.quantity})
                    </span>
                  ))}
                </div>

                {po.status !== 'Received' && (
                  <div className="flex justify-end pt-2">
                    <button onClick={() => markAsReceived(po.id)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300">
                      <CheckCircle2 size={14} /> Mark as Received
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Order">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Supplier Name</label>
              <input required type="text" className="input-field" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Supplier Email</label>
              <input type="email" className="input-field" value={formData.supplierEmail} onChange={e => setFormData({...formData, supplierEmail: e.target.value})} />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={16}/> Add Items</h4>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Medicine" name="medicineName" value={currentItem.medicineName} onChange={handleItemChange} className="input-field text-sm flex-1" />
              <input type="number" placeholder="Qty" name="quantity" value={currentItem.quantity} onChange={handleItemChange} className="input-field text-sm w-20" />
              <input type="number" placeholder="Est. Price" name="expectedPrice" value={currentItem.expectedPrice} onChange={handleItemChange} className="input-field text-sm w-24" />
              <button type="button" onClick={addItem} className="bg-primary text-white p-2 rounded-lg hover:bg-sky-500"><Plus size={18}/></button>
            </div>
            {formData.items.length > 0 && (
              <ul className="space-y-2 mt-4 max-h-32 overflow-y-auto custom-scrollbar">
                {formData.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded text-sm">
                    <span><span className="font-bold">{item.medicineName}</span> • Qty: {item.quantity} • ₹{item.expectedPrice}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Additional Notes</label>
            <textarea className="input-field text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          </div>
          
          <button type="submit" className="btn-primary w-full mt-2">Send Purchase Order</button>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrderManagement;
