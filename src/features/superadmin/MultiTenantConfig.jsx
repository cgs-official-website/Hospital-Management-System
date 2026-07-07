import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, Palette, Globe, Save, Search, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MultiTenantConfig = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [config, setConfig] = useState({
    themeColor: '#0ea5e9',
    customDomain: '',
    supportEmail: '',
    maxUsersLimit: 50
  });

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
    setConfig({
      themeColor: hosp.themeColor || '#0ea5e9',
      customDomain: hosp.customDomain || '',
      supportEmail: hosp.supportEmail || '',
      maxUsersLimit: hosp.maxUsersLimit || 50
    });
    setSuccessMsg(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'hospitals', selectedHospital.id), {
        ...config
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      showPopup("Failed to save tenant configuration.", 'error');
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
                <p className="text-xs text-slate-500 truncate">{hosp.customDomain || 'No custom domain'}</p>
              </div>
            </button>
          ))}
          {filteredHospitals.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">No active tenants found.</div>
          )}
        </div>
      </div>

      {/* Config Editor */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {!selectedHospital ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Globe size={64} className="mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Tenant Configuration Engine</h3>
            <p className="max-w-md">Select an active hospital from the list to manage their white-labeling, branding, and core infrastructure limits.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Configure: {selectedHospital.hospitalName}</h3>
                <p className="text-sm text-slate-500 mt-1">Tenant ID: <span className="font-mono">{selectedHospital.id}</span></p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <section>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4 pb-2 border-b border-slate-100">
                  <Palette size={20} className="text-primary"/> White-Label Branding
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Primary Theme Color (HEX)</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={config.themeColor} 
                        onChange={e => setConfig({...config, themeColor: e.target.value})}
                        className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={config.themeColor} 
                        onChange={e => setConfig({...config, themeColor: e.target.value})}
                        className="input-field uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4 pb-2 border-b border-slate-100">
                  <Globe size={20} className="text-primary"/> Infrastructure & Routing
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Custom Subdomain</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        value={config.customDomain} 
                        onChange={e => setConfig({...config, customDomain: e.target.value})}
                        className="w-full px-4 py-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 focus:bg-white outline-none"
                        placeholder="e.g. cityhospital"
                      />
                      <span className="bg-slate-100 border border-l-0 border-slate-200 px-4 py-3 rounded-r-xl text-slate-500 font-medium">
                        .zuna.com
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Email Override</label>
                    <input 
                      type="email" 
                      value={config.supportEmail} 
                      onChange={e => setConfig({...config, supportEmail: e.target.value})}
                      className="input-field"
                      placeholder="support@cityhospital.com"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4 pb-2 border-b border-slate-100">
                  <Building2 size={20} className="text-primary"/> Database Limits
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Max User Accounts Limit</label>
                    <input 
                      type="number" 
                      value={config.maxUsersLimit} 
                      onChange={e => setConfig({...config, maxUsersLimit: Number(e.target.value)})}
                      className="input-field"
                      min="1"
                    />
                    <p className="text-xs text-slate-500 mt-2">Hard limit on how many staff accounts this tenant can create.</p>
                  </div>
                </div>
              </section>

            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {successMsg && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} /> Configuration synced to tenant database
                  </motion.span>
                )}
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default MultiTenantConfig;
