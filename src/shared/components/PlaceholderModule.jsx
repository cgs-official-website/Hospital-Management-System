import React from 'react';
import { Construction, Sparkles, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const PlaceholderModule = ({ title, description }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-panel p-10 min-h-[70vh] flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 text-slate-50 opacity-50 pointer-events-none">
        <Server size={300} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 shadow-premium border border-white"
        >
          <Construction size={48} className="text-primary" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">ZUNA HMS</h2>
        <h3 className="text-xl font-bold text-primary mb-4">{title}</h3>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          {description || "This enterprise module is currently being provisioned for your workspace. Database bindings and UI components will be activated in an upcoming phase."}
        </p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white shadow-soft flex items-start gap-4 text-left"
        >
          <div className="p-2 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
            <Sparkles className="text-orange-600" size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">Enterprise Architecture</h4>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">This module will be seamlessly integrated into the multi-tenant Firebase architecture, fully adhering to your role-based access controls and custom layouts.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlaceholderModule;
