import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { showPopup, showConfirm } from '../../utils/popup';
import { CreditCard, Plus, Edit2, Trash2, Check, X, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const SubscriptionBilling = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    maxUsers: '',
    features: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'subscription_plans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by price
      data.sort((a, b) => Number(a.price) - Number(b.price));
      setPlans(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        maxUsers: plan.maxUsers,
        features: plan.features.join(', ')
      });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', price: '', billingCycle: 'monthly', maxUsers: '', features: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        price: Number(formData.price),
        maxUsers: Number(formData.maxUsers),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'subscription_plans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'subscription_plans'), planData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving plan:", error);
      showPopup("Failed to save plan.", "error");
    }
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to delete this subscription plan?", async () => {
      try {
        await deleteDoc(doc(db, 'subscription_plans', id));
      } catch (error) {
        console.error("Error deleting plan: ", error);
        showPopup("Failed to delete plan.", "error");
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading plans...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Subscription Plans</h2>
          <p className="text-slate-500">Manage SaaS tiers, pricing, and limits for vendors.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={plan.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50 text-center relative">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <CreditCard size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{plan.name}</h3>
              <div className="mt-4 flex items-end justify-center gap-1">
                <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500 font-medium pb-1">/{plan.billingCycle}</span>
              </div>
            </div>

            <div className="p-8 flex-1">
              <div className="flex items-center gap-2 text-slate-700 font-bold mb-4 bg-sky-50 p-3 rounded-lg border border-sky-100">
                <Users size={18} className="text-primary"/> 
                Up to {plan.maxUsers} Users
              </div>
              <ul className="space-y-3">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button onClick={() => openModal(plan)} className="flex-1 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Edit2 size={16} /> Edit
              </button>
              <button onClick={() => handleDelete(plan.id)} className="px-4 bg-white border border-slate-200 hover:border-red-500 hover:text-red-500 text-slate-400 py-2.5 rounded-xl transition-colors shadow-sm">
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plan Name</label>
                <input required type="text" className="input-field" placeholder="e.g. Enterprise Tier" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input required type="number" className="input-field" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Billing Cycle</label>
                  <select className="input-field" value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Max Users Allowed</label>
                <input required type="number" className="input-field" placeholder="e.g. 50" value={formData.maxUsers} onChange={e => setFormData({...formData, maxUsers: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Features (comma separated)</label>
                <textarea required className="input-field min-h-[100px]" placeholder="Unlimited Patients, IPD Module, 24/7 Support..." value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})}></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="btn-primary">{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionBilling;
