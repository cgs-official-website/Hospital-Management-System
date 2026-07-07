import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Bed, LogOut, ArrowRightLeft, Search, CheckCircle2 } from 'lucide-react';
import { showPopup, showConfirm } from '../../utils/popup';
import Modal from '../../shared/components/Modal';

const ADTManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ department: '', bedNumber: '' });

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'ipd_admissions'), where('hospitalId', '==', hospitalId), where('status', '==', 'admitted'));
    const unsub = onSnapshot(q, (snap) => {
      setAdmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [hospitalId]);

  const handleOpenTransfer = (patient) => {
    setSelectedPatient(patient);
    setTransferData({ department: patient.department, bedNumber: patient.bedNumber });
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'ipd_admissions', selectedPatient.id), {
        department: transferData.department,
        bedNumber: transferData.bedNumber
      });
      showPopup("Patient transferred successfully", "success");
      setIsTransferModalOpen(false);
    } catch (err) {
      console.error(err);
      showPopup("Transfer failed", "error");
    }
  };

  const handleDischargeRequest = (id) => {
    showConfirm("Initiate discharge process for this patient?", async () => {
      try {
        await updateDoc(doc(db, 'ipd_admissions', id), {
          dischargeRequested: true,
          dischargeRequestedAt: new Date()
        });
        showPopup("Discharge process initiated", "success");
      } catch (err) {
        showPopup("Action failed", "error");
      }
    });
  };

  const filteredAdmissions = admissions.filter(a => 
    a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.bedNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ADT Management</h2>
          <p className="text-sm text-slate-500">Admissions, Discharges, and Transfers.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search name or bed..." 
            className="input-field pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-sky-600 uppercase tracking-widest">Total Inpatients</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{admissions.length}</p>
          </div>
          <Users size={24} className="text-sky-500" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        {(() => {
          const totalPages = Math.ceil(filteredAdmissions.length / itemsPerPage);
          const currentAdmissions = filteredAdmissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          
          return (
            <>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Patient</th>
                    <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Current Location</th>
                    <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Doctor & Reason</th>
                    <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Status</th>
                    <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                  ) : filteredAdmissions.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active admissions found.</td></tr>
                  ) : (
                    currentAdmissions.map((record) => (
                      <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{record.patientName}</p>
                          <p className="text-xs text-slate-500">{record.age}y {record.gender} • ID: {record.patientId || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Bed size={16} className="text-primary"/>
                            <div>
                              <p className="font-bold text-slate-700">Bed {record.bedNumber}</p>
                              <p className="text-xs text-slate-500">{record.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-slate-700 max-w-[200px] truncate" title={record.admissionReason}>{record.admissionReason}</p>
                          <p className="text-xs text-slate-500">Dr. {record.attendingDoctor}</p>
                        </td>
                        <td className="p-4">
                          {record.dischargeRequested ? (
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Discharge Pending</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Admitted</span>
                          )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleOpenTransfer(record)} className="p-2 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors" title="Transfer Bed/Ward">
                            <ArrowRightLeft size={16} />
                          </button>
                          {!record.dischargeRequested && (
                            <button onClick={() => handleDischargeRequest(record.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors" title="Request Discharge">
                              <LogOut size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 sticky bottom-0 z-10 gap-4">
                  <span className="text-sm font-medium text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmissions.length)} of {filteredAdmissions.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Patient">
        {selectedPatient && (
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex justify-between">
              <div>
                <p className="text-xs text-slate-500">Patient</p>
                <p className="font-bold text-slate-800">{selectedPatient.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Current Location</p>
                <p className="font-bold text-slate-800">{selectedPatient.department} - Bed {selectedPatient.bedNumber}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">New Department/Ward</label>
                <input required type="text" className="input-field" value={transferData.department} onChange={e => setTransferData({...transferData, department: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">New Bed Number</label>
                <input required type="text" className="input-field" value={transferData.bedNumber} onChange={e => setTransferData({...transferData, bedNumber: e.target.value})} />
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-full mt-4">Confirm Transfer</button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ADTManagement;
