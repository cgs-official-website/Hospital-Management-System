import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Fingerprint, CheckCircle2, History } from 'lucide-react';

const AttendanceTracker = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userRole') === 'superadmin' ? 'Superadmin' : 'Staff'; // Normally stored in user profile
  
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [todaysRecord, setTodaysRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  useEffect(() => {
    if (!hospitalId || !userId) return;

    // Determine query based on role
    // Admin sees all attendance for the hospital, staff only sees their own
    let q;
    if (userRole === 'admin') {
      q = query(collection(db, 'attendance'), where('hospitalId', '==', hospitalId));
    } else {
      q = query(collection(db, 'attendance'), 
        where('hospitalId', '==', hospitalId),
        where('userId', '==', userId)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceLogs(logs);

      // Find if staff has a record for today
      const todayLog = logs.find(l => l.date === todayStr && l.userId === userId);
      setTodaysRecord(todayLog || null);
    });

    return () => unsub();
  }, [hospitalId, userId, userRole, todayStr]);

  const handleClockIn = async () => {
    try {
      await addDoc(collection(db, 'attendance'), {
        hospitalId,
        userId,
        staffName: userName,
        date: todayStr,
        checkInTime: new Date().toLocaleTimeString(),
        checkOutTime: null,
        status: 'Present'
      });
    } catch (error) {
      console.error("Error clocking in", error);
    }
  };

  const handleClockOut = async () => {
    if (!todaysRecord) return;
    try {
      await updateDoc(doc(db, 'attendance', todaysRecord.id), {
        checkOutTime: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error("Error clocking out", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance & Time Tracking</h2>
          <p className="text-sm text-slate-500">Record your daily work hours.</p>
        </div>
        
        {/* Only show clock in/out if they are not superadmin/admin (or if you want admins to clock in too) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4 w-full md:w-auto">
          <Fingerprint size={32} className={todaysRecord && !todaysRecord.checkOutTime ? "text-green-500" : "text-slate-400"} />
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm">Today: {new Date().toLocaleDateString()}</h4>
            <p className="text-xs text-slate-500">
              {todaysRecord ? 
                (todaysRecord.checkOutTime ? `Clocked out at ${todaysRecord.checkOutTime}` : `Clocked in at ${todaysRecord.checkInTime}`) 
                : "Not clocked in yet"}
            </p>
          </div>
          <div>
            {!todaysRecord ? (
              <button onClick={handleClockIn} className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                Clock In
              </button>
            ) : !todaysRecord.checkOutTime ? (
              <button onClick={handleClockOut} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                Clock Out
              </button>
            ) : (
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                <CheckCircle2 size={16} /> Complete
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <History size={18} /> {userRole === 'admin' ? "Hospital Attendance Logs" : "My Attendance History"}
        </h3>
        
        <div className="overflow-x-auto custom-scrollbar w-full">
          {(() => {
            const totalPages = Math.ceil(attendanceLogs.length / itemsPerPage);
            const currentLogs = attendanceLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            
            return (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                      <th className="py-3 px-4 font-medium">Date</th>
                      {userRole === 'admin' && <th className="py-3 px-4 font-medium">Staff Name</th>}
                      <th className="py-3 px-4 font-medium">Check-In Time</th>
                      <th className="py-3 px-4 font-medium">Check-Out Time</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 5 : 4} className="text-center py-6 text-slate-500">
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      currentLogs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-700">{log.date}</td>
                          {userRole === 'admin' && <td className="py-3 px-4">{log.staffName}</td>}
                          <td className="py-3 px-4 text-slate-600">{log.checkInTime}</td>
                          <td className="py-3 px-4 text-slate-600">{log.checkOutTime || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                              log.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {log.status}
                            </span>
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, attendanceLogs.length)} of {attendanceLogs.length} entries
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
    </div>
  );
};

export default AttendanceTracker;
