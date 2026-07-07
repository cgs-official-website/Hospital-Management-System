import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { AlertTriangle, Clock, AlertCircle, PackageX } from 'lucide-react';

const StockAlerts = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
    const unsub = onSnapshot(q, (snap) => {
      setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [hospitalId]);

  const lowStock = medicines.filter(m => m.stock < 50);
  
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  
  const expiring = medicines.filter(m => {
    if (!m.expiry) return false;
    const expDate = new Date(m.expiry);
    return expDate <= nextMonth;
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Stock & Expiry Alerts</h2>
        <p className="text-sm text-slate-500">Monitor critical inventory levels and upcoming expirations.</p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Low Stock Alerts */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-4 text-lg">
              <AlertTriangle size={20}/> Low Stock Alerts ({lowStock.length})
            </h3>
            
            {lowStock.length === 0 ? (
              <div className="text-center py-8 text-orange-600/50">
                <CheckCircle2 size={32} className="mx-auto mb-2" />
                No low stock items.
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map(med => (
                  <div key={med.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">Category: {med.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-orange-600 text-lg">{med.stock}</span>
                      <span className="text-xs text-orange-500 block">Units left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiry Alerts */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4 text-lg">
              <Clock size={20}/> Expiring Soon ({expiring.length})
            </h3>
            
            {expiring.length === 0 ? (
              <div className="text-center py-8 text-red-600/50">
                <CheckCircle2 size={32} className="mx-auto mb-2" />
                No items expiring within 30 days.
              </div>
            ) : (
              <div className="space-y-3">
                {expiring.map(med => {
                  const exp = new Date(med.expiry);
                  const isExpired = exp < today;
                  return (
                    <div key={med.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-xs text-slate-500">Stock: {med.stock}</p>
                      </div>
                      <div className="text-right">
                        {isExpired ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <PackageX size={12}/> EXPIRED
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={12}/> {med.expiry}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Simple CheckCircle2 mock since it wasn't imported from lucide
const CheckCircle2 = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default StockAlerts;
