import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Bell, Mail, MessageSquare, Save, CheckCircle2, FileText, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const TEMPLATE_TYPES = [
  { id: 'welcome_email', name: 'Welcome Email (New Tenant)', type: 'email' },
  { id: 'invoice_receipt', name: 'Invoice Receipt', type: 'email' },
  { id: 'password_reset', name: 'Password Reset', type: 'email' },
  { id: 'appointment_reminder', name: 'Appointment Reminder', type: 'sms' },
  { id: 'otp_verification', name: 'OTP Verification', type: 'sms' }
];

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_TYPES[0]);
  
  const [content, setContent] = useState({ subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notification_templates'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setTemplates(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (templates[selectedTemplate.id]) {
      setContent(templates[selectedTemplate.id]);
    } else {
      setContent({ 
        subject: selectedTemplate.type === 'email' ? 'New Notification' : '', 
        body: 'Enter your template content here. Use {{variable_name}} for dynamic data.' 
      });
    }
  }, [selectedTemplate, templates]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'notification_templates', selectedTemplate.id), content);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving template:", error);
      showPopup("Failed to save template.", 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-1/4 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Notification CMS</h3>
          <p className="text-xs text-slate-500 mt-1">Select a template to edit.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {TEMPLATE_TYPES.map(tmpl => (
            <button 
              key={tmpl.id}
              onClick={() => { setSelectedTemplate(tmpl); setSuccessMsg(false); }}
              className={`w-full text-left p-4 border-b border-slate-50 flex items-center gap-3 transition-colors ${selectedTemplate.id === tmpl.id ? 'bg-sky-50 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTemplate.id === tmpl.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tmpl.type === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate">{tmpl.name}</p>
                <p className="text-xs text-slate-500 uppercase">{tmpl.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedTemplate.name}</h3>
              <p className="text-sm text-slate-500">Variables available: <code className="bg-slate-200 px-1 rounded text-xs">{"{{user_name}}"}</code> <code className="bg-slate-200 px-1 rounded text-xs">{"{{hospital_name}}"}</code></p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            
            {selectedTemplate.type === 'email' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Subject</label>
                <input 
                  type="text" 
                  value={content.subject} 
                  onChange={e => setContent({...content, subject: e.target.value})}
                  className="input-field font-medium"
                  placeholder="Welcome to ZUNA!"
                  required
                />
              </div>
            )}

            <div className="flex-1 flex flex-col h-full">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {selectedTemplate.type === 'email' ? 'Email Body (HTML supported)' : 'SMS Content (Max 160 chars)'}
              </label>
              <textarea 
                value={content.body} 
                onChange={e => setContent({...content, body: e.target.value})}
                className="input-field flex-1 min-h-[300px] font-mono text-sm leading-relaxed"
                placeholder="Hello {{user_name}}, welcome to..."
                required
              ></textarea>
              {selectedTemplate.type === 'sms' && (
                <p className={`text-xs mt-2 font-bold ${content.body.length > 160 ? 'text-red-500' : 'text-slate-500'}`}>
                  {content.body.length} / 160 characters
                </p>
              )}
            </div>

          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-auto">
            <div>
              {successMsg && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} /> Template published globally
                </motion.span>
              )}
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={18} /> {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default NotificationTemplates;
