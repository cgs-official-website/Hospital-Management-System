import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, Search, CheckCircle2, ToggleLeft, ToggleRight, Save, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const ALL_MODULES = [
  'IPD Management', 'OPD Management', 'Telemedicine', 'Doctor Consultation', 
  'Pharmacy Inventory', 'Lab & Diagnostic Orders', 'Billing & Invoicing', 
  'Duty Roster & Leave', 'Hospital Reports'
];

const ModuleToggle = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [disabledModules, setDisabledModules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'hospitals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHospitals(data.filter(h => h.status === 'active'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelect = (hosp) => {
    setSelectedHospital(hosp);
    setDisabledModules(hosp.disabledModules || []);
    setSuccessMsg(false);
  };

  const toggleModule = (modName) => {
    setDisabledModules(prev => 
      prev.includes(modName) ? prev.filter(m => m !== modName) : [...prev, modName]
    );
  };

  const handleSave = async () => {
    if (!selectedHospital) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'hospitals', selectedHospital.id), {
        disabledModules
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving modules:", error);
      showPopup("Failed to update module access.", 'error');
    }
    setSaving(false);
  };

  const filteredHospitals = hospitals.filter(h => 
    h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading tenants...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-4">Select Tenant Workspace</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search active hospitals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredHospitals.map(hosp => (
            <button 
              key={hosp.id}
              onClick={() => handleSelect(hosp)}
              className={`w-full text-left p-4 border-b border-slate-50 flex items-center gap-3 transition-colors ${selectedHospital?.id === hosp.id ? 'bg-sky-50 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedHospital?.id === hosp.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Building2 size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate">{hosp.hospitalName}</p>
                <p className="text-xs text-slate-500 truncate">{hosp.disabledModules?.length || 0} modules disabled</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Editor */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {!selectedHospital ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <LayoutDashboard size={64} className="mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Module & Feature Toggles</h3>
            <p className="max-w-md">Select a tenant to grant or revoke access to specific enterprise modules.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Access Control: {selectedHospital.hospitalName}</h3>
                <p className="text-sm text-slate-500 mt-1">Tenant ID: <span className="font-mono">{selectedHospital.id}</span></p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 mb-8">
                <ShieldAlert className="text-orange-500 mt-0.5 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-orange-800 text-sm">Strict Access Control</h4>
                  <p className="text-sm text-orange-700 mt-1">Disabling a module instantly revokes access for all staff members within this hospital. The module will disappear from their sidebars immediately.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {ALL_MODULES.map(mod => {
                  const isEnabled = !disabledModules.includes(mod);
                  return (
                    <div key={mod} className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                      <div>
                        <h4 className={`font-bold text-lg ${isEnabled ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{mod}</h4>
                        <p className="text-sm text-slate-500">{isEnabled ? 'Access Granted' : 'Access Revoked'}</p>
                      </div>
                      <button 
                        onClick={() => toggleModule(mod)}
                        className={`transition-colors ${isEnabled ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {isEnabled ? <ToggleRight size={48} strokeWidth={1.5} /> : <ToggleLeft size={48} strokeWidth={1.5} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {successMsg && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} /> Access controls synced
                  </motion.span>
                )}
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save Toggles'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default ModuleToggle;
