import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, Save, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_ROLES = ['admin', 'nurse', 'pharmacist', 'receptionist', 'doctor'];
const CORE_PERMISSIONS = ['view_patients', 'edit_patients', 'view_billing', 'edit_billing', 'manage_inventory', 'prescribe_meds', 'view_reports'];

const GlobalRoleManagement = () => {
  const [rolesConfig, setRolesConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'global_roles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().permissions || [];
      });
      // Pre-fill missing roles
      DEFAULT_ROLES.forEach(r => {
        if (!data[r]) data[r] = [];
      });
      setRolesConfig(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (perm) => {
    setRolesConfig(prev => {
      const currentPerms = prev[selectedRole] || [];
      const newPerms = currentPerms.includes(perm) 
        ? currentPerms.filter(p => p !== perm) 
        : [...currentPerms, perm];
      
      return { ...prev, [selectedRole]: newPerms };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'global_roles', selectedRole), {
        permissions: rolesConfig[selectedRole]
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving roles:", error);
      showPopup("Failed to save global role permissions.", 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading role configurations...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-1/4 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">System Roles</h3>
          <p className="text-xs text-slate-500 mt-1">Select a role to modify default permissions.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {DEFAULT_ROLES.map(role => (
            <button 
              key={role}
              onClick={() => { setSelectedRole(role); setSuccessMsg(false); }}
              className={`w-full text-left p-4 border-b border-slate-50 flex items-center gap-3 transition-colors ${selectedRole === role ? 'bg-sky-50 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedRole === role ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Users size={16} />
              </div>
              <p className="font-bold text-slate-800 text-sm capitalize">{role.replace('_', ' ')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Permission Editor */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight capitalize">{selectedRole.replace('_', ' ')} Permissions</h3>
            <p className="text-sm text-slate-500 mt-1">Global template applied to all tenants.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 mb-8">
            <Shield className="text-blue-500 mt-0.5 shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-blue-800 text-sm">Global Enforcement</h4>
              <p className="text-sm text-blue-700 mt-1">Changes made here will instantly update the default access rights for every staff member holding this role across all hospital workspaces.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {CORE_PERMISSIONS.map(perm => {
              const isGranted = rolesConfig[selectedRole]?.includes(perm);
              return (
                <div key={perm} 
                  onClick={() => handleToggle(perm)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isGranted ? 'bg-sky-50 border-primary shadow-sm' : 'bg-white border-slate-200 hover:border-primary/50'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isGranted ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                    {isGranted && <CheckCircle2 size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isGranted ? 'text-primary' : 'text-slate-700'}`}>{perm.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                    <p className="text-xs text-slate-500">{isGranted ? 'Access Granted' : 'Access Restricted'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {successMsg && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} /> Permissions synced globally
              </motion.span>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default GlobalRoleManagement;
