import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { showConfirm } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Users, Search, Plus, X, CheckCircle2, Activity, Clock, ShieldCheck, Stethoscope } from 'lucide-react';

const IPDManagement = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('admitted'); // admitted, discharged, all
  
  const hospitalId = localStorage.getItem('hospitalId');

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    age: '',
    gender: 'Male',
    department: '',
    bedNumber: '',
    admissionReason: '',
    attendingDoctor: ''
  });

  useEffect(() => {
    if (!hospitalId) return;

    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      setAdmissions(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'ipd_admissions'), {
        ...formData,
        hospitalId,
        status: 'admitted',
        admissionDate: serverTimestamp(),
        dischargeDate: null
      });
      setIsModalOpen(false);
      setFormData({
        patientName: '', patientId: '', age: '', gender: 'Male', 
        department: '', bedNumber: '', admissionReason: '', attendingDoctor: ''
      });
    } catch (error) {
      console.error("Error admitting patient:", error);
    }
  };

  const handleDischarge = async (id) => {
    showConfirm("Are you sure you want to discharge this patient? This will free up their bed.", async () => {
      try {
        await updateDoc(doc(db, 'ipd_admissions', id), { status: 'Discharged' });
      } catch (error) {
        console.error("Error discharging: ", error);
      }
    });
  };

  const filteredAdmissions = admissions.filter(a => {
    const matchesSearch = a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalAdmitted = admissions.filter(a => a.status === 'admitted').length;
  const totalDischarged = admissions.filter(a => a.status === 'discharged').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">IPD Management</h1>
          <p className="text-slate-500 mt-1">Manage Inpatient Department admissions and bed occupancy.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={20} /> Admit Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Current Inpatients</p>
            <p className="text-3xl font-extrabold text-slate-800">{totalAdmitted}</p>
          </div>
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-primary">
            <Bed size={24} />
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Discharges</p>
            <p className="text-3xl font-extrabold text-slate-800">{totalDischarged}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Bed Occupancy</p>
            <p className="text-3xl font-extrabold text-slate-800">45%</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Activity size={24} />
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
          <div className="flex gap-2">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto font-bold text-slate-600"
            >
              <option value="all">All Records</option>
              <option value="admitted">Currently Admitted</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Patient</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Location</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Admission Details</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Status</th>
                <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading admissions...</td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <Bed size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-lg">No records found</p>
                    <p className="text-sm">Click "Admit Patient" to register a new IPD admission.</p>
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {record.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{record.patientName}</p>
                          <p className="text-xs text-slate-500">ID: {record.patientId || 'N/A'} • {record.age}y {record.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <Bed size={14} className="text-slate-400"/> Bed {record.bedNumber}
                        </span>
                        <span className="text-xs text-slate-500">{record.department}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-700 truncate max-w-[200px]" title={record.admissionReason}>
                          {record.admissionReason}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Stethoscope size={12}/> Dr. {record.attendingDoctor}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-max ${
                        record.status === 'admitted' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {record.status === 'admitted' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {record.status === 'admitted' ? (
                        <button 
                          onClick={() => handleDischarge(record.id)}
                          className="text-xs font-bold bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 text-slate-600 px-3 py-2 rounded-lg transition-all shadow-sm"
                        >
                          Discharge Patient
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Discharged</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Admit New Patient</h2>
                  <p className="text-sm text-slate-500">Register a patient to the Inpatient Department.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdmit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                
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
                    <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                    <input type="number" name="age" required value={formData.age} onChange={handleChange} className="input-field" placeholder="Years" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-field font-bold text-slate-700">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Department/Ward</label>
                    <input type="text" name="department" required value={formData.department} onChange={handleChange} className="input-field" placeholder="e.g. General Ward" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Bed Number</label>
                    <input type="text" name="bedNumber" required value={formData.bedNumber} onChange={handleChange} className="input-field" placeholder="e.g. B-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Attending Doctor</label>
                    <input type="text" name="attendingDoctor" required value={formData.attendingDoctor} onChange={handleChange} className="input-field" placeholder="Doctor's Name" />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-sm font-bold text-slate-700 ml-1">Reason for Admission</label>
                  <textarea name="admissionReason" required value={formData.admissionReason} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Brief medical condition..."></textarea>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={18} />
                    Admit Patient
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

export default IPDManagement;
