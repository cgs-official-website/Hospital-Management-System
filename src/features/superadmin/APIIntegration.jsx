import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link as LinkIcon, Save, CheckCircle2, Copy, RefreshCw, Smartphone, Mail, Globe, Code } from 'lucide-react';
import { motion } from 'framer-motion';

const APIIntegration = () => {
  const [config, setConfig] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    sendgridApiKey: '',
    webhookSecret: 'whsec_zuna_' + Math.random().toString(36).substr(2, 10),
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_settings', 'api_integrations'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'global_settings', 'api_integrations'), config);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving API config:", error);
      showPopup("Failed to save API configuration.", 'error');
    }
    setSaving(false);
  };

  const regenerateWebhook = () => {
    setConfig(prev => ({
      ...prev,
      webhookSecret: 'whsec_zuna_' + Math.random().toString(36).substr(2, 10) + Math.random().toString(36).substr(2, 10)
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(config.webhookSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading API configurations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">API & 3rd-Party Integrations</h2>
          <p className="text-slate-500">Configure global gateways for SMS, Email, and Webhook callbacks.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Third Party Keys */}
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Communication Gateways</h3>
                <p className="text-sm text-slate-500">Twilio and SendGrid credentials.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <Smartphone size={18} className="text-blue-500"/> Twilio (SMS Engine)
                </h4>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Account SID</label>
                  <input 
                    type="text" 
                    value={config.twilioAccountSid} 
                    onChange={e => setConfig({...config, twilioAccountSid: e.target.value})}
                    className="input-field font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Auth Token</label>
                    <input 
                      type="password" 
                      value={config.twilioAuthToken} 
                      onChange={e => setConfig({...config, twilioAuthToken: e.target.value})}
                      className="input-field font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Sender Phone No.</label>
                    <input 
                      type="text" 
                      value={config.twilioPhoneNumber} 
                      onChange={e => setConfig({...config, twilioPhoneNumber: e.target.value})}
                      className="input-field font-mono text-sm"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <Mail size={18} className="text-orange-500"/> SendGrid (Email Engine)
                </h4>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={config.sendgridApiKey} 
                    onChange={e => setConfig({...config, sendgridApiKey: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="SG...."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {successMsg && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} /> API Keys Saved
                  </motion.span>
                )}
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save Keys'}
              </button>
            </div>
          </form>
        </div>

        {/* Webhooks & API Docs */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-green-400 flex items-center justify-center">
                <Code size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">ZUNA REST API</h3>
                <p className="text-sm text-slate-400">Endpoints for ERP integrations</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Global Webhook Secret</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={config.webhookSecret} 
                      readOnly
                      className="w-full bg-slate-950 border border-slate-800 text-green-400 font-mono text-sm rounded-xl px-4 py-3 outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Copy"
                    >
                      {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <button 
                    onClick={regenerateWebhook}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                    title="Regenerate Secret"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Use this secret to verify signatures on incoming webhook payloads.</p>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-3">
                <p className="text-sm font-bold text-slate-300 mb-2">Popular Endpoints</p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group cursor-pointer hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-sky-400">GET</span>
                    <span className="text-slate-300 font-mono">/api/v1/hospitals</span>
                  </div>
                  <LinkIcon size={16} className="text-slate-600 group-hover:text-slate-400" />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group cursor-pointer hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-green-400">POST</span>
                    <span className="text-slate-300 font-mono">/api/v1/billing/sync</span>
                  </div>
                  <LinkIcon size={16} className="text-slate-600 group-hover:text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-950 text-center border-t border-slate-800">
              <a href="#" className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors">View Full API Documentation →</a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default APIIntegration;
