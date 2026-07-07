import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { LayoutTemplate, Save, CheckCircle2, Type, Image as ImageIcon, Link as LinkIcon, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const CMSLandingPage = () => {
  const [content, setContent] = useState({
    heroHeadline: 'The Future of Hospital Management',
    heroSubtext: 'Enterprise-grade SaaS for managing clinics and multi-specialty hospitals with zero friction.',
    ctaText: 'Start Your Free Trial',
    featuresTitle: 'Why Choose ZUNA?',
    contactEmail: 'sales@zuna.com'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_settings', 'landing_page'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'global_settings', 'landing_page'), content);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error("Error saving CMS config:", error);
      showPopup("Failed to save landing page content.", 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading CMS editor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Landing Page CMS</h2>
          <p className="text-slate-500">Edit the text and content of the public-facing ZUNA marketing website.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Editor Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Content Editor</h3>
              <p className="text-sm text-slate-500">Changes here reflect instantly on the live site.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6 flex-1">
            
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Type size={18} className="text-primary"/> Hero Section
              </h4>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Main Headline</label>
                <input 
                  type="text" 
                  value={content.heroHeadline} 
                  onChange={e => setContent({...content, heroHeadline: e.target.value})}
                  className="input-field font-bold text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Subtext / Description</label>
                <textarea 
                  value={content.heroSubtext} 
                  onChange={e => setContent({...content, heroSubtext: e.target.value})}
                  className="input-field min-h-[100px]"
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Call to Action (Button Text)</label>
                <input 
                  type="text" 
                  value={content.ctaText} 
                  onChange={e => setContent({...content, ctaText: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                <LayoutTemplate size={18} className="text-primary"/> Features Section
              </h4>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Section Title</label>
                <input 
                  type="text" 
                  value={content.featuresTitle} 
                  onChange={e => setContent({...content, featuresTitle: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                <LinkIcon size={18} className="text-primary"/> Footer Settings
              </h4>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sales Contact Email</label>
                <input 
                  type="email" 
                  value={content.contactEmail} 
                  onChange={e => setContent({...content, contactEmail: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
            </div>

          </form>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              {successMsg && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} /> Content published live
                </motion.span>
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={18} /> {saving ? 'Publishing...' : 'Publish to Live Site'}
            </button>
          </div>
        </motion.div>

        {/* Live Preview (Mock) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="bg-slate-800 p-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto bg-slate-700 rounded text-xs text-slate-400 px-24 py-1 font-mono">zuna.com</div>
          </div>
          
          <div className="flex-1 bg-white relative overflow-hidden flex flex-col items-center justify-center text-center p-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            
            <div className="max-w-md space-y-6">
              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">{content.heroHeadline}</h1>
              <p className="text-lg text-slate-600">{content.heroSubtext}</p>
              <button className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                {content.ctaText}
              </button>
            </div>
            
            <div className="absolute bottom-12 w-full px-12">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-sm mb-6">{content.featuresTitle}</p>
              <div className="flex justify-center gap-4 opacity-50">
                <div className="w-24 h-16 bg-slate-200 rounded-lg"></div>
                <div className="w-24 h-16 bg-slate-200 rounded-lg"></div>
                <div className="w-24 h-16 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default CMSLandingPage;
