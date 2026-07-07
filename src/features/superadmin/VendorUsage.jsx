import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { FileText, Database, Users, HardDrive, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const VendorUsage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'hospitals'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const hosp = doc.data();
        // Mock current usage for demonstration. In production, query the actual users collection for this hospital.
        const maxUsers = hosp.maxUsersLimit || 50;
        const currentUsers = 0;
        
        return {
          id: doc.id,
          ...hosp,
          currentUsers,
          maxUsers,
          storageUsed: 0, // GB
          maxStorage: 10 // GB
        };
      });
      setHospitals(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading usage statistics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Usage & License Management</h2>
          <p className="text-slate-500">Monitor tenant resource consumption and license limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
        {hospitals.map((hosp, idx) => {
          const userPercent = (hosp.currentUsers / hosp.maxUsers) * 100;
          const storagePercent = (hosp.storageUsed / hosp.maxStorage) * 100;
          const isWarning = userPercent > 85 || storagePercent > 85;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={hosp.id} 
              className={`bg-white rounded-2xl border ${isWarning ? 'border-orange-300 shadow-orange-100' : 'border-slate-200'} overflow-hidden shadow-sm hover:shadow-md transition-all`}
            >
              <div className={`p-5 border-b ${isWarning ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'} flex justify-between items-start`}>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{hosp.hospitalName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Tenant ID: {hosp.id}</p>
                </div>
                {isWarning && (
                  <div className="bg-orange-100 text-orange-700 p-2 rounded-lg" title="Approaching Limit">
                    <AlertTriangle size={16} />
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                
                {/* Users Limit */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <Users size={16} className="text-primary"/> User Licenses
                    </div>
                    <div className="text-sm font-medium">
                      <span className={userPercent > 85 ? 'text-orange-600' : 'text-slate-800'}>{hosp.currentUsers}</span>
                      <span className="text-slate-400"> / {hosp.maxUsers}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${userPercent > 85 ? 'bg-orange-500' : 'bg-primary'}`} 
                      style={{ width: `${userPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Storage Limit */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <HardDrive size={16} className="text-indigo-500"/> Storage Used
                    </div>
                    <div className="text-sm font-medium">
                      <span className={storagePercent > 85 ? 'text-orange-600' : 'text-slate-800'}>{hosp.storageUsed} GB</span>
                      <span className="text-slate-400"> / {hosp.maxStorage} GB</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${storagePercent > 85 ? 'bg-orange-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${storagePercent}%` }}
                    ></div>
                  </div>
                </div>

              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex">
                <button className="w-full text-center text-sm font-bold text-primary hover:text-sky-700 transition-colors">
                  Manage Limits →
                </button>
              </div>
            </motion.div>
          );
        })}

        {hospitals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            No active tenants to monitor.
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorUsage;
