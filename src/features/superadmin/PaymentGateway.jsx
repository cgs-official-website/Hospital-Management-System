import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CreditCard, Save, CheckCircle2, DollarSign, Activity, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentGateway = () => {
  const [config, setConfig] = useState({
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    currency: 'USD',
    taxRate: 0,
    enableAutoBilling: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_settings', 'payment_gateway'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'global_settings', 'payment_gateway'), config);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving payment config:", error);
      showPopup("Failed to save payment configuration.", 'error');
    }
    setSaving(false);
  };

  const dummyTransactions = [];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading secure gateway settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Payment Gateway & Revenue</h2>
          <p className="text-slate-500">Configure global payment processors and monitor platform revenue.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Stripe Integration</h3>
                <p className="text-sm text-slate-500">API Keys for processing subscription payments.</p>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    Publishable Key
                  </label>
                  <input 
                    type="text" 
                    value={config.stripePublicKey} 
                    onChange={e => setConfig({...config, stripePublicKey: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    Secret Key <Lock size={14} className="text-orange-500"/>
                  </label>
                  <input 
                    type="password" 
                    value={config.stripeSecretKey} 
                    onChange={e => setConfig({...config, stripeSecretKey: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="sk_test_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    Webhook Secret <Lock size={14} className="text-orange-500"/>
                  </label>
                  <input 
                    type="password" 
                    value={config.stripeWebhookSecret} 
                    onChange={e => setConfig({...config, stripeWebhookSecret: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="whsec_..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                  <select 
                    value={config.currency} 
                    onChange={e => setConfig({...config, currency: e.target.value})}
                    className="input-field"
                  >
                    <option value="USD">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Global Tax Rate (%)</label>
                  <input 
                    type="number" 
                    value={config.taxRate} 
                    onChange={e => setConfig({...config, taxRate: Number(e.target.value)})}
                    className="input-field"
                    min="0" max="100"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  {successMsg && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} /> Keys securely saved
                    </motion.span>
                  )}
                </div>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Quick Stats & Logs */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-br from-indigo-500 to-primary rounded-2xl p-6 text-white shadow-md">
            <h3 className="font-medium text-indigo-100 mb-1">Monthly Recurring Revenue</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-extrabold">₹12,450</span>
              <span className="text-indigo-200 font-medium mb-1">.00</span>
            </div>
            <div className="bg-white/20 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm">
              <Activity size={20} className="text-green-300" />
              <span className="text-sm font-medium">+14% vs last month</span>
            </div>
          </motion.div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {dummyTransactions.map(trx => (
                <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{trx.hospital}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{trx.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">₹{trx.amount}</p>
                    <p className={`text-xs font-bold ${trx.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>{trx.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 text-center text-sm font-bold text-primary hover:bg-sky-50 transition-colors">
              View All Transactions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
