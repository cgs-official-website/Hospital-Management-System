import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { showConfirm } from '../../utils/popup';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, Plus, X, Trash2, Shield, Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const DutyRoster = () => {
  const [roster, setRoster] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const hospitalId = localStorage.getItem('hospitalId');

  const [formData, setFormData] = useState({
    staffId: '',
    date: '',
    shiftType: 'morning', // morning, evening, night
    notes: ''
  });

  useEffect(() => {
    if (!hospitalId) return;

    // Fetch Staff for assignment dropdown
    const qStaff = query(collection(db, 'users'), where('hospitalId', '==', hospitalId));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      const staffList = [];
      snapshot.forEach(doc => staffList.push({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
    });

    // Fetch Roster assignments
    const qRoster = query(collection(db, 'duty_roster'), where('hospitalId', '==', hospitalId));
    const unsubRoster = onSnapshot(qRoster, (snapshot) => {
      const rosterList = [];
      snapshot.forEach(doc => rosterList.push({ id: doc.id, ...doc.data() }));
      setRoster(rosterList);
      setLoading(false);
    });

    return () => {
      unsubStaff();
      unsubRoster();
    };
  }, [hospitalId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const staffMember = staff.find(s => s.id === formData.staffId);
      await addDoc(collection(db, 'duty_roster'), {
        ...formData,
        staffName: staffMember?.name || 'Unknown',
        staffRole: staffMember?.role || 'Unknown',
        hospitalId,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setFormData({ staffId: '', date: '', shiftType: 'morning', notes: '' });
    } catch (error) {
      console.error("Error adding duty:", error);
    }
  };

  const handleDelete = async (id) => {
    showConfirm("Remove this shift assignment?", async () => {
      try {
        await deleteDoc(doc(db, 'duty_roster', id));
      } catch (error) {
        console.error("Error deleting roster: ", error);
      }
    });
  };

  const getShiftColor = (type) => {
    switch(type) {
      case 'morning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'evening': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'night': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Generate week days
  const startOfWeek = new Date(currentWeek);
  startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Monday
  
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const nextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Duty Roster</h1>
          <p className="text-slate-500 mt-1">Schedule and manage hospital staff shifts.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <CalendarIcon size={20} /> Assign Shift
        </button>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        
        {/* Calendar Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={prevWeek} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-slate-800 min-w-[200px] text-center">
              {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
            <button onClick={nextWeek} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Morning</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-400"></div> Evening</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-400"></div> Night</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="min-w-[800px] h-full flex flex-col">
              <div className="grid grid-cols-7 border-b border-slate-200 sticky top-0 bg-white z-10 shadow-sm">
                {weekDays.map((day, i) => (
                  <div key={i} className="p-4 text-center border-r border-slate-100 last:border-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {day.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 flex-1">
                {weekDays.map((day, i) => {
                  const dayString = day.toISOString().split('T')[0];
                  const dayShifts = roster.filter(r => r.date === dayString);
                  
                  return (
                    <div key={i} className="border-r border-slate-100 last:border-0 p-2 min-h-[200px] bg-white/40">
                      <div className="space-y-2">
                        {dayShifts.map(shift => (
                          <div key={shift.id} className={`p-3 rounded-xl border ${getShiftColor(shift.shiftType)} relative group`}>
                            <button 
                              onClick={() => handleDelete(shift.id)}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white rounded-md"
                            >
                              <X size={14} />
                            </button>
                            <p className="font-bold text-sm capitalize">{shift.staffName}</p>
                            <p className="text-xs opacity-80 uppercase tracking-wider mt-0.5">{shift.staffRole}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase opacity-60">
                              <Clock size={10} />
                              {shift.shiftType}
                            </div>
                          </div>
                        ))}
                        {dayShifts.length === 0 && (
                          <div className="h-full flex items-center justify-center pt-8 text-slate-300">
                            <span className="text-xs font-medium">No shifts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-[95%] md:max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Assign Shift</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Staff Member</label>
                  <select 
                    name="staffId"
                    required
                    value={formData.staffId}
                    onChange={handleChange}
                    className="input-field appearance-none font-bold text-slate-700"
                  >
                    <option value="">-- Select Staff --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                    <input 
                      type="date" 
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="input-field" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Shift</label>
                    <select 
                      name="shiftType"
                      required
                      value={formData.shiftType}
                      onChange={handleChange}
                      className="input-field appearance-none font-bold text-slate-700"
                    >
                      <option value="morning">Morning (08:00 - 16:00)</option>
                      <option value="evening">Evening (16:00 - 00:00)</option>
                      <option value="night">Night (00:00 - 08:00)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Special Notes (Optional)</label>
                  <input 
                    type="text" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input-field" 
                    placeholder="e.g. ICU Duty"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={18} />
                    Confirm Shift
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DutyRoster;
