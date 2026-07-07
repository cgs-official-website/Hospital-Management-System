import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, ActivitySquare } from 'lucide-react';

const PatientRecords = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const hospitalId = localStorage.getItem('hospitalId');

  useEffect(() => {
    if (!hospitalId) return;
    const q = query(collection(db, 'patients'), where('hospitalId', '==', hospitalId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPatients(list);
    });
    return () => unsubscribe();
  }, [hospitalId]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.contact.includes(search)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Records</h2>
          <p className="text-sm text-slate-500">View and search through registered patients.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid gap-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl">
              No patients found matching your search.
            </div>
          ) : (
            filteredPatients.map(p => (
              <div key={p.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-100 to-sky-50 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.contact} | {p.gender} | {p.dob}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <span className="block text-slate-400 text-xs">Blood Group</span>
                    <span className="font-bold text-red-500">{p.bloodGroup}</span>
                  </div>
                  <button className="btn-secondary py-2 px-4 flex items-center gap-2">
                    <ActivitySquare size={16} /> View History
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;
