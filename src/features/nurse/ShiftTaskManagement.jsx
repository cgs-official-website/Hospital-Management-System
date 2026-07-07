import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckSquare, Square, Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react';

const ShiftTaskManagement = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    
    // We fetch tasks for the whole hospital ward or specific to nurses
    const q = query(collection(db, 'nurse_tasks'), where('hospitalId', '==', hospitalId));
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(records.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [hospitalId]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      await addDoc(collection(db, 'nurse_tasks'), {
        hospitalId,
        text: newTaskText.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        author: 'Nurse User'
      });
      setNewTaskText('');
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, 'nurse_tasks', task.id), {
        completed: !task.completed,
        completedAt: !task.completed ? serverTimestamp() : null
      });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'nurse_tasks', id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
      
      <div className="mb-6 shrink-0 text-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <CheckSquare className="text-primary"/> Shift Handover & Tasks
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage your daily nursing duties and handover notes.</p>
      </div>

      <form onSubmit={addTask} className="mb-6 shrink-0 relative">
        <input 
          type="text" 
          placeholder="Add a new task or handover note..." 
          className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary focus:bg-white outline-none transition-colors shadow-inner font-medium text-slate-700"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!newTaskText.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-auto custom-scrollbar space-y-8 pb-6">
        
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <>
            {/* Pending Tasks */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock size={16}/> Pending Tasks ({pendingTasks.length})
              </h3>
              
              {pendingTasks.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center text-slate-400">
                  You're all caught up! No pending tasks.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary/50 transition-colors">
                      <button onClick={() => toggleTask(task)} className="flex items-center gap-3 flex-1 text-left">
                        <Square size={22} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                        <span className="font-medium text-slate-700">{task.text}</span>
                      </button>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded hidden sm:block">By {task.author}</span>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16}/> Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                  {completedTasks.map(task => (
                    <div key={task.id} className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <button onClick={() => toggleTask(task)} className="flex items-center gap-3 flex-1 text-left">
                        <CheckSquare size={22} className="text-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-500 line-through">{task.text}</span>
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftTaskManagement;
