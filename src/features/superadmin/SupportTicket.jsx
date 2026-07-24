import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { MessageSquare, AlertCircle, CheckCircle2, Clock, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

const SupportTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');

  // New ticket state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHospital, setNewHospital] = useState('Central Clinic');
  const [newPriority, setNewPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // In a real app we'd sort by createdAt. Mocking simple query for now.
    const q = query(collection(db, 'support_tickets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort: Open first, then by date (mocking date sort if no timestamp)
      data.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return 0;
      });
      setTickets(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDesc.trim()) return;
    setSubmitting(true);
    try {
      const ticketPayload = {
        productId: 'clinic-management',
        productName: 'Clinic Management System',
        hospitalName: newHospital,
        clientName: newHospital,
        subject: newSubject.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: [{
          sender: 'Client',
          author: newHospital,
          text: newDesc.trim(),
          timestamp: new Date().toISOString()
        }]
      };

      await addDoc(collection(db, 'support_tickets'), ticketPayload);
      try {
        await addDoc(collection(db, 'tickets'), ticketPayload);
      } catch (err) {}

      setNewSubject('');
      setNewDesc('');
      setShowCreateModal(false);
      alert('✓ Support ticket submitted to Zuna Admin Panel!');
    } catch (err) {
      console.error('Failed raising ticket:', err);
      alert('Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { status: newStatus });
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;

    try {
      const updatedMessages = [...(selectedTicket.messages || []), {
        sender: 'Superadmin (Support Team)',
        role: 'superadmin',
        text: reply,
        timestamp: new Date().toISOString()
      }];

      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        messages: updatedMessages,
        status: 'in-progress'
      });

      setSelectedTicket(prev => ({ ...prev, messages: updatedMessages, status: 'in-progress' }));
      setReply('');
    } catch (error) {
      console.error("Error replying to ticket:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Open</span>;
      case 'in-progress': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Clock size={12}/> In Progress</span>;
      case 'resolved': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Resolved</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading helpdesk tickets...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Ticket List */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Support Tickets</h3>
          <p className="text-xs text-slate-500 mt-1">Tenant issues & inquiries</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tickets.map(ticket => (
            <button 
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`w-full text-left p-4 border-b border-slate-50 flex flex-col gap-2 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-sky-50 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start w-full">
                <p className="font-bold text-slate-800 text-sm truncate pr-2">{ticket.subject}</p>
                {getStatusBadge(ticket.status)}
              </div>
              <p className="text-xs text-slate-500 truncate">{ticket.hospitalName}</p>
              <p className="text-xs text-slate-400 font-mono">{ticket.id.slice(0,8)}</p>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No support tickets found.</div>
          )}
        </div>
      </div>

      {/* Ticket Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare size={64} className="mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Central Helpdesk</h3>
            <p className="max-w-md">Select a ticket from the left to view the conversation history and reply to the tenant.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{selectedTicket.hospitalName}</span>
                  • 
                  <span>Ticket ID: <span className="font-mono">{selectedTicket.id}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="input-field py-1.5 text-sm font-bold bg-white"
                >
                  <option value="open">Mark as Open</option>
                  <option value="in-progress">Mark In-Progress</option>
                  <option value="resolved">Mark Resolved</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {selectedTicket.messages?.map((msg, i) => {
                const isSuperadmin = msg.role === 'superadmin';
                return (
                  <div key={i} className={`flex gap-4 ${isSuperadmin ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSuperadmin ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <User size={20} />
                    </div>
                    <div className={`max-w-[70%] ${isSuperadmin ? 'text-right' : 'text-left'}`}>
                      <p className="text-xs font-bold text-slate-500 mb-1">{msg.sender}</p>
                      <div className={`p-4 rounded-2xl text-sm ${isSuperadmin ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                <div className="text-center text-slate-400 py-8">No messages in this thread yet.</div>
              )}
            </div>

            <form onSubmit={handleReply} className="p-4 border-t border-slate-100 bg-white flex gap-3">
              <input 
                type="text" 
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply to the tenant..." 
                className="flex-1 input-field"
                disabled={selectedTicket.status === 'resolved'}
              />
              <button 
                type="submit" 
                disabled={!reply.trim() || selectedTicket.status === 'resolved'}
                className="bg-primary hover:bg-sky-600 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default SupportTicket;
