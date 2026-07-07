import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings2, Search, ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { showPopup } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const StockAdjustment = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    type: 'deduct', // add or deduct
    quantity: '',
    reason: 'Damage/Breakage',
    notes: ''
  });

  useEffect(() => {
    const fetchMeds = async () => {
      if (!hospitalId) return;
      const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
      const snap = await getDocs(q);
      setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchMeds();
  }, [hospitalId]);

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpen = (med) => {
    setSelectedMed(med);
    setFormData({ type: 'deduct', quantity: '', reason: 'Damage/Breakage', notes: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMed || !formData.quantity) return;
    
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      showPopup("Please enter a valid positive quantity", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const newStock = formData.type === 'add' 
        ? selectedMed.stock + qty 
        : selectedMed.stock - qty;
      
      if (newStock < 0) {
        showPopup("Cannot deduct more than available stock", "error");
        setIsProcessing(false);
        return;
      }

      // 1. Update Inventory
      await updateDoc(doc(db, 'inventory', selectedMed.id), {
        stock: newStock
      });

      // 2. Log Adjustment
      await addDoc(collection(db, 'stock_adjustments'), {
        hospitalId,
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        type: formData.type,
        quantity: qty,
        previousStock: selectedMed.stock,
        newStock: newStock,
        reason: formData.reason,
        notes: formData.notes,
        date: serverTimestamp()
      });

      // Update local state for immediate feedback
      setMedicines(medicines.map(m => m.id === selectedMed.id ? { ...m, stock: newStock } : m));
      
      showPopup("Stock adjusted successfully", "success");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Failed to adjust stock", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Adjustments</h2>
          <p className="text-sm text-slate-500">Manually correct stock due to loss, damage, or audits.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search medicine to adjust..." 
            className="input-field pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMeds.map(med => (
            <div key={med.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col bg-slate-50">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{med.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{med.category}</p>
                <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Current Stock</span>
                  <span className="font-extrabold text-lg text-slate-800">{med.stock}</span>
                </div>
              </div>
              <button onClick={() => handleOpen(med)} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 py-2">
                <Settings2 size={16} /> Adjust Stock
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adjust Stock Level">
        {selectedMed && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">Medicine</p>
                <p className="font-bold text-slate-800">{selectedMed.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Current Stock</p>
                <p className="font-bold text-slate-800">{selectedMed.stock}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Adjustment Type</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'deduct'})}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-sm font-bold rounded-md transition-colors ${formData.type === 'deduct' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowDownRight size={14} /> Deduct
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'add'})}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-sm font-bold rounded-md transition-colors ${formData.type === 'add' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowUpRight size={14} /> Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Quantity</label>
                <input required type="number" min="1" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Reason</label>
              <select className="input-field" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                <option>Damage/Breakage</option>
                <option>Expired Item</option>
                <option>Inventory Audit Correction</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Notes (Optional)</label>
              <textarea className="input-field text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>

            <button type="submit" disabled={isProcessing} className="btn-primary w-full mt-2">
              {isProcessing ? 'Processing...' : 'Apply Adjustment'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StockAdjustment;
