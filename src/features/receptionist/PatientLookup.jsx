import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Search, Phone, Calendar, Droplet, User, Activity } from 'lucide-react';
import Modal from '../../shared/components/Modal';

const PatientLookup = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'patients'), where('hospitalId', '==', hospitalId));
    
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(records.sort((a, b) => (b.registeredAt?.seconds || 0) - (a.registeredAt?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId]);

  const handleRowClick = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const filteredPatients = patients.filter(p => 
    ((p.name || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.contact?.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Directory</h2>
          <p className="text-sm text-slate-500">Quickly lookup patient records and demographics.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="input-field pl-11 py-3 text-sm shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-sky-600 uppercase tracking-widest">Total Registered</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{patients.length}</p>
          </div>
          <Users size={32} className="text-sky-400 opacity-50" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
        <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white/50 overflow-hidden">
          {(() => {
            const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
            const currentPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            
            return (
              <>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                      <tr>
                        <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Patient Details</th>
                        <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Contact</th>
                        <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Demographics</th>
                        <th className="p-4 font-bold text-slate-600 text-sm border-b border-slate-200">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading directory...</td></tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-slate-500">
                            <Users size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="font-bold text-lg">No patients found</p>
                            <p className="text-sm">Try adjusting your search query.</p>
                          </td>
                        </tr>
                      ) : (
                        currentPatients.map(patient => (
                          <tr 
                            key={patient.id} 
                            onClick={() => handleRowClick(patient)}
                            className="border-b border-slate-100 hover:bg-sky-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                  {patient.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-base group-hover:text-primary transition-colors">{patient.name}</p>
                                  <p className="text-xs text-slate-500">ID: {patient.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                <Phone size={14} className="text-slate-400" /> {patient.contact}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2 text-xs font-bold text-slate-600">
                                <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1"><User size={12}/> {patient.gender}</span>
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded flex items-center gap-1 border border-red-100"><Droplet size={12}/> {patient.bloodGroup}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar size={14} /> {patient.registeredAt ? new Date(patient.registeredAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 0 && (
                  <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 gap-4 shrink-0">
                    <span className="text-sm font-medium text-slate-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} entries
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
      </div>

      {/* Patient Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Patient Profile">
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center font-bold text-white text-2xl shadow-md">
                {selectedPatient.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                <p className="text-sm text-slate-500">Internal ID: {selectedPatient.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Phone</p>
                <p className="font-medium text-slate-700">{selectedPatient.contact}</p>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date of Birth</p>
                <p className="font-medium text-slate-700">{selectedPatient.dob}</p>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Gender & Blood</p>
                <p className="font-medium text-slate-700">{selectedPatient.gender} | <span className="text-red-500 font-bold">{selectedPatient.bloodGroup}</span></p>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Registered On</p>
                <p className="font-medium text-slate-700">
                  {selectedPatient.registeredAt ? new Date(selectedPatient.registeredAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
              <p className="text-sm font-bold text-sky-700 flex items-center gap-2 mb-2">
                <Activity size={16}/> Medical History / Allergies
              </p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">
                {selectedPatient.medicalHistory || 'No prior medical history or allergies recorded on registration.'}
              </p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientLookup;
