import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, CheckCircle2, XCircle, AlertTriangle, Search, Filter, Mail, Phone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const VendorOnboarding = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'hospitals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHospitals(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'hospitals', id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
      showPopup("Failed to update status.", 'error');
    }
  };

  const filteredHospitals = hospitals.filter(hosp => {
    const matchesFilter = filter === 'all' || hosp.status === filter;
    const matchesSearch = ((hosp.hospitalName || "").toLowerCase().includes(searchTerm.toLowerCase())) || 
                          ((hosp.registrationNo || "").toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Active</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Pending</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Rejected</span>;
      case 'suspended': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Suspended</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading vendor data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vendor Onboarding & CRM</h2>
          <p className="text-slate-500">Manage hospital registrations, verifications, and approvals.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search hospitals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
        {filteredHospitals.map((hosp, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={hosp.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{hosp.hospitalName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Reg: {hosp.registrationNo}</p>
                </div>
              </div>
              {getStatusBadge(hosp.status)}
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Chief Doctor</p>
                  <p className="text-slate-800 font-medium">{hosp.chiefDoctorName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Created At</p>
                  <p className="text-slate-800 font-medium flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400"/>
                    {hosp.createdAt?.toDate ? new Date(hosp.createdAt.toDate()).toLocaleDateString() : hosp.createdAt ? new Date(hosp.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {hosp.patientCount !== undefined && (
                  <>
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Est. Patients / Month</p>
                      <p className="text-slate-800 font-bold">{hosp.patientCount}</p>
                    </div>
                    <div>
                      <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Est. Monthly Pricing</p>
                      <p className="text-indigo-700 font-extrabold text-base">₹{(hosp.estimatedPrice || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-sm flex items-center gap-2 text-slate-600">
                  <Mail size={16} className="text-slate-400"/> {hosp.adminEmail}
                </p>
                <p className="text-sm flex items-center gap-2 text-slate-600">
                  <Phone size={16} className="text-slate-400"/> {hosp.phone || hosp.contact || 'Not Provided'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              {hosp.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(hosp.id, 'active')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">Approve</button>
                  <button onClick={() => updateStatus(hosp.id, 'rejected')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">Reject</button>
                </>
              )}
              {hosp.status === 'active' && (
                <button onClick={() => updateStatus(hosp.id, 'suspended')} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm font-bold transition-colors">Suspend Vendor</button>
              )}
              {(hosp.status === 'suspended' || hosp.status === 'rejected') && (
                <button onClick={() => updateStatus(hosp.id, 'active')} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">Restore Access</button>
              )}
            </div>
          </motion.div>
        ))}

        {filteredHospitals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            No vendors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOnboarding;
