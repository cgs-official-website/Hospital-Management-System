import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { PieChart, BarChart3, TrendingUp, Users, Activity, IndianRupee, FileText, Download } from 'lucide-react';

const HospitalReports = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPatients: 0,
    activeStaff: 0,
    activeAdmissions: 0
  });
  const [loading, setLoading] = useState(true);
  
  const hospitalId = localStorage.getItem('hospitalId');

  useEffect(() => {
    if (!hospitalId) return;

    // Subscriptions for real-time counts
    const unsubInvoices = onSnapshot(query(collection(db, 'invoices'), where('hospitalId', '==', hospitalId)), (snapshot) => {
      let rev = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid') rev += (data.amount || 0);
      });
      setStats(prev => ({ ...prev, totalRevenue: rev }));
    });

    const unsubStaff = onSnapshot(query(collection(db, 'users'), where('hospitalId', '==', hospitalId)), (snapshot) => {
      setStats(prev => ({ ...prev, activeStaff: snapshot.size }));
    });

    const unsubIPD = onSnapshot(query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId)), (snapshot) => {
      let admitted = 0;
      snapshot.forEach(doc => {
        if (doc.data().status === 'admitted') admitted++;
      });
      setStats(prev => ({ ...prev, activeAdmissions: admitted }));
    });

    const unsubPatients = onSnapshot(query(collection(db, 'patients'), where('hospitalId', '==', hospitalId)), (snapshot) => {
      setStats(prev => ({ ...prev, totalPatients: snapshot.size }));
    });

    setTimeout(() => setLoading(false), 800);

    return () => {
      unsubInvoices();
      unsubStaff();
      unsubIPD();
      unsubPatients();
    };
  }, [hospitalId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 mt-1">Real-time hospital performance and financial metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <FileText size={18} /> Generate PDF
          </button>
          <button className="btn-primary">
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-4 gap-6">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-b-4 border-b-emerald-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
              <div className="flex justify-between items-start mb-4 relative">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <IndianRupee size={24} />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp size={12}/> 0%
                </span>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1 relative">Total Revenue</p>
              <h3 className="text-3xl font-extrabold text-slate-800 relative">₹{stats.totalRevenue.toLocaleString()}</h3>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-b-4 border-b-sky-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-50 rounded-full blur-2xl opacity-60"></div>
              <div className="flex justify-between items-start mb-4 relative">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1 relative">Total Patients</p>
              <h3 className="text-3xl font-extrabold text-slate-800 relative">{stats.totalPatients.toLocaleString()}</h3>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-b-4 border-b-amber-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl opacity-60"></div>
              <div className="flex justify-between items-start mb-4 relative">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Activity size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1 relative">Active IPD</p>
              <h3 className="text-3xl font-extrabold text-slate-800 relative">{stats.activeAdmissions}</h3>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 border-b-4 border-b-purple-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl opacity-60"></div>
              <div className="flex justify-between items-start mb-4 relative">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1 relative">Active Staff</p>
              <h3 className="text-3xl font-extrabold text-slate-800 relative">{stats.activeStaff}</h3>
            </motion.div>

          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-6">
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-panel p-6 lg:col-span-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg text-slate-800">Monthly Revenue Flow</h3>
                <select className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 rounded-lg px-3 py-1 outline-none focus:border-primary">
                  <option>This Year</option>
                  <option>Last 6 Months</option>
                </select>
              </div>
              
              {/* CSS Bar Chart Representation */}
              <div className="h-64 flex items-end gap-2 md:gap-4 mt-8 pb-6 border-b border-slate-100 relative">
                
                {/* Y Axis Guides */}
                <div className="absolute left-0 top-0 w-full h-full flex flex-col justify-between z-0 pb-6 pointer-events-none">
                  <div className="w-full border-t border-slate-100 border-dashed h-0 flex items-center"><span className="text-[10px] font-bold text-slate-300 bg-white pr-2 -translate-y-1/2">₹500k</span></div>
                  <div className="w-full border-t border-slate-100 border-dashed h-0 flex items-center"><span className="text-[10px] font-bold text-slate-300 bg-white pr-2 -translate-y-1/2">₹250k</span></div>
                  <div className="w-full border-t border-slate-100 border-dashed h-0 flex items-center"><span className="text-[10px] font-bold text-slate-300 bg-white pr-2 -translate-y-1/2">₹0</span></div>
                </div>

                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 group z-10">
                    <div className="w-full max-w-[40px] bg-sky-100 rounded-t-lg group-hover:bg-sky-200 transition-colors relative" style={{ height: '0%' }}>
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs py-1 px-2 rounded-md font-bold transition-opacity whitespace-nowrap left-1/2 -translate-x-1/2 shadow-lg">₹0</div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{month}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-6">Patient Demographics</h3>
              
              <div className="flex-1 flex flex-col justify-center gap-6">
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700">Adults (18-60y)</span>
                    <span className="font-bold text-sky-600">0%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-sky-500 h-2.5 rounded-full shadow-sm" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700">Seniors (60y+)</span>
                    <span className="font-bold text-emerald-600">0%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full shadow-sm" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700">Pediatrics (0-17y)</span>
                    <span className="font-bold text-amber-600">0%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full shadow-sm" style={{ width: '0%' }}></div>
                  </div>
                </div>

              </div>

              <div className="mt-8 p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-center gap-4">
                <PieChart size={32} className="text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Auto-Generated Report</p>
                  <p className="text-xs text-slate-500 mt-0.5">Updated live based on system data.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </>
      )}

    </div>
  );
};

export default HospitalReports;
