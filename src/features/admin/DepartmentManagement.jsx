import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { showConfirm } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Plus, Edit2, Trash2, Search, X, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const hospitalId = localStorage.getItem('hospitalId');

  const [formData, setFormData] = useState({
    name: '',
    head: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'departments'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const deptList = [];
      querySnapshot.forEach((doc) => {
        deptList.push({ id: doc.id, ...doc.data() });
      });
      setDepartments(deptList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (dept) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name || '',
      head: dept.head || '',
      description: dept.description || '',
      status: dept.status || 'active'
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', head: '', description: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isEdit = !!editingId;
    const currentEditingId = editingId;
    const currentFormData = { ...formData };
    
    // Close modal immediately
    setIsModalOpen(false);
    setFormData({ name: '', head: '', description: '', status: 'active' });
    setEditingId(null);

    // Wait for modal exit animation
    setTimeout(async () => {
      try {
        if (isEdit) {
          await updateDoc(doc(db, 'departments', currentEditingId), {
            ...currentFormData
          });
        } else {
          await addDoc(collection(db, 'departments'), {
            ...currentFormData,
            hospitalId,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Error saving department:", error);
      }
    }, 300);
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to delete this department? This may affect staff assignments.", async () => {
      try {
        await deleteDoc(doc(db, 'departments', id));
      } catch (error) {
        console.error("Error deleting department: ", error);
      }
    });
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Departments & Wards</h1>
          <p className="text-slate-500 mt-1">Structure your hospital by creating specialized units.</p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus size={20} /> Create Department
        </button>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>

        {/* Grid/Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="text-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50">
              <Grid size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-lg text-slate-700">No departments configured</p>
              <p className="text-sm text-slate-500 mt-1">Create units like Cardiology, ICU, or Pharmacy to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
              {filteredDepts.map((dept) => (
                <div key={dept.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(dept)} className="p-2 text-slate-400 hover:text-primary bg-slate-50 hover:bg-sky-50 rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-primary flex items-center justify-center mb-4 border border-sky-100">
                    <Grid size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{dept.name}</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Head of Dept:</span>
                      <span className="font-bold text-slate-700">{dept.head || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-bold capitalize ${dept.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {dept.status}
                      </span>
                    </div>
                  </div>
                  {dept.description && (
                    <p className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                      {dept.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Department' : 'New Department'}</h2>
                </div>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Department Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field" 
                    placeholder="e.g. Cardiology"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Head of Department</label>
                  <input 
                    type="text" 
                    name="head"
                    value={formData.head}
                    onChange={handleChange}
                    className="input-field" 
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description (Optional)</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field min-h-[100px] py-3" 
                    placeholder="Brief overview of this department's functions..."
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <Plus size={18} />
                    {editingId ? 'Save Changes' : 'Create Unit'}
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

export default DepartmentManagement;
