import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { showPopup, showConfirm } from '../../utils/popup';
import { PackageSearch, Plus, AlertCircle, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../shared/components/Modal';

const PharmacyInventory = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tablet',
    stock: '',
    price: '',
    expiry: ''
  });

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
    const unsub = onSnapshot(q, (snap) => {
      setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [hospitalId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inventory'), {
        ...formData,
        hospitalId,
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price)
      });
      setIsModalOpen(false);
      setFormData({ name: '', category: 'Tablet', stock: '', price: '', expiry: '' });
    } catch (error) {
      console.error("Error adding medicine", error);
    }
  };

  const handleDelete = async (id) => {
    showConfirm("Delete this item from inventory?", async () => {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch(err) {
        showPopup("Failed to delete item", "error");
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let addedCount = 0;
        for (const row of data) {
          if (!row.Name || row.Stock == null) continue;
          
          await addDoc(collection(db, 'inventory'), {
            hospitalId,
            name: row.Name,
            category: row.Category || 'Tablet',
            stock: parseInt(row.Stock) || 0,
            price: parseFloat(row.Price) || 0,
            expiry: row.Expiry || ''
          });
          addedCount++;
        }
        showPopup(`Successfully uploaded ${addedCount} medicines`, 'success');
        e.target.value = null; 
      } catch (error) {
        console.error("Error parsing Excel:", error);
        showPopup("Failed to parse Excel file. Ensure columns are: Name, Category, Stock, Price, Expiry.", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pharmacy Inventory</h2>
          <p className="text-sm text-slate-500">Manage medicine stocks and supplies.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search medicines..." 
            className="input-field w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current.click()} className="btn-secondary shrink-0 flex items-center gap-2 font-bold px-4 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <Upload size={18} /> Upload Excel
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white/50 overflow-hidden">
        {(() => {
          const totalPages = Math.ceil(filteredMeds.length / itemsPerPage);
          const currentMeds = filteredMeds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          
          return (
            <>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                      <th className="py-3 px-4 font-medium">Medicine Name</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium text-center">Stock Level</th>
                      <th className="py-3 px-4 font-medium">Unit Price</th>
                      <th className="py-3 px-4 font-medium">Expiry Date</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeds.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500">
                          <PackageSearch size={32} className="mx-auto mb-2 opacity-50" />
                          No medicines found in inventory.
                        </td>
                      </tr>
                    ) : (
                      currentMeds.map(med => (
                        <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-800">{med.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{med.category}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              med.stock > 50 ? 'bg-green-100 text-green-700' :
                              med.stock > 10 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {med.stock} Units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">₹{med.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(med.expiry) < new Date() ? (
                              <span className="text-red-500 flex items-center gap-1 font-bold"><AlertCircle size={14}/> EXPIRED</span>
                            ) : (
                              <span className="text-slate-600">{med.expiry}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 flex justify-end gap-2">
                            <button onClick={() => handleDelete(med.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 gap-4 shrink-0">
                  <span className="text-sm font-medium text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMeds.length)} of {filteredMeds.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Medicine to Inventory">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Medicine Name</label>
            <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Tablet</option><option>Syrup</option><option>Injection</option><option>Ointment</option><option>Drops</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input required type="number" min="0" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
              <input required type="number" step="0.01" min="0" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input required type="date" className="input-field" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">Add to Inventory</button>
        </form>
      </Modal>
    </div>
  );
};

export default PharmacyInventory;
