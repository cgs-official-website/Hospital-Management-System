import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, Users, Building2, Activity, Globe, Server, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const GlobalAnalytics = () => {
  const [stats, setStats] = useState({
    activeHospitals: 0,
    pendingHospitals: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qActive = query(collection(db, 'hospitals'), where('status', '==', 'active'));
    const unsubscribeActive = onSnapshot(qActive, (snap) => {
      setStats(prev => ({ ...prev, activeHospitals: snap.size }));
    });

    const qPending = query(collection(db, 'hospitals'), where('status', '==', 'pending'));
    const unsubscribePending = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pendingHospitals: snap.size }));
      setLoading(false);
    });

    return () => {
      unsubscribeActive();
      unsubscribePending();
    };
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Compiling global analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Platform Analytics</h2>
          <p className="text-slate-500">High-level view of SaaS performance and infrastructure health.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
              0% <ArrowUpRight size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Monthly Revenue</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">${stats.totalRevenue.toLocaleString()}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Building2 size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Active Tenants</p>
          <div className="flex items-end gap-3 mt-1">
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.activeHospitals}</h3>
            <span className="text-sm font-bold text-orange-500 mb-1">{stats.pendingHospitals} pending</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Staff Users</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.activeUsers.toLocaleString()}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Server size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Server Uptime</p>
          <h3 className="text-3xl font-extrabold text-emerald-500 mt-1">99.99%</h3>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Growth Chart Mock */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800">MRR Growth (Last 6 Months)</h3>
            </div>
          </div>
          <div className="p-6 h-64 flex items-end justify-between gap-2">
            {[0, 0, 0, 0, 0, 0].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-t-lg relative h-48 flex items-end group-hover:bg-indigo-50 transition-colors">
                  <div 
                    className="w-full bg-indigo-500 rounded-t-lg transition-all duration-1000 group-hover:bg-primary"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">M{i+1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Global Activity Feed */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800">Live Infrastructure Map</h3>
            </div>
            <Activity className="text-green-500 animate-pulse" size={20} />
          </div>
          <div className="flex-1 p-8 flex items-center justify-center bg-slate-900 relative overflow-hidden">
            <Globe className="text-slate-800 opacity-20 absolute" size={300} />
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-block p-4 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700">
                <Server className="text-green-400 mb-2 mx-auto" size={32} />
                <p className="text-green-400 font-mono text-sm font-bold">ALL SYSTEMS OPERATIONAL</p>
              </div>
              <div className="flex gap-4 justify-center">
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-mono mb-1">US-EAST</p>
                  <p className="text-white font-bold">12ms</p>
                </div>
                <div className="w-px bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-mono mb-1">EU-WEST</p>
                  <p className="text-white font-bold">45ms</p>
                </div>
                <div className="w-px bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-mono mb-1">AP-SOUTH</p>
                  <p className="text-white font-bold">89ms</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default GlobalAnalytics;
