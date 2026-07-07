import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Search, Filter, AlertTriangle, User, Database, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');


  useEffect(() => {
    // In production, fetch real logs
    const q = query(collection(db, 'audit_logs'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filterType === 'all' || log.type === filterType;
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'auth': return <User size={16} />;
      case 'data': return <Database size={16} />;
      case 'system': return <Globe size={16} />;
      default: return <ShieldCheck size={16} />;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading security logs...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Security & Audit Logs</h2>
          <p className="text-slate-500">Monitor platform-wide administrative actions and security events.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users or actions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="auth">Authentication</option>
              <option value="data">Data Access</option>
              <option value="system">System Config</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 sticky top-0">
              <tr>
                <th className="p-4 font-bold">Event Type</th>
                <th className="p-4 font-bold">Action Performed</th>
                <th className="p-4 font-bold">User / Initiator</th>
                <th className="p-4 font-bold">IP Address</th>
                <th className="p-4 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={log.id} 
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getSeverityStyles(log.severity)}`}>
                      {getIcon(log.type)} {log.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-800">{log.action}</td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{log.user}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                  <td className="p-4 text-slate-500">{new Date(log.time).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-500">No logs found matching criteria.</div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <p>Showing {filteredLogs.length} events</p>
          <button className="flex items-center gap-2 text-primary font-bold hover:text-sky-700 transition-colors">
            Export Logs to CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
