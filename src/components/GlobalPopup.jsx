import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, HelpCircle } from 'lucide-react';
import { popupEvent } from '../utils/popup';

const GlobalPopup = () => {
  const [popup, setPopup] = useState(null); // { id, message, type, isConfirm, onConfirm }

  useEffect(() => {
    let timer;
    const handleShow = (e) => {
      setPopup({
        id: Date.now(),
        message: e.detail.message,
        type: e.detail.type || 'info',
        isConfirm: false
      });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setPopup(null);
      }, 2500);
    };

    const handleConfirm = (e) => {
      setPopup({
        id: Date.now(),
        message: e.detail.message,
        type: 'warning',
        isConfirm: true,
        onConfirm: e.detail.onConfirm
      });
      if (timer) clearTimeout(timer);
    };

    popupEvent.addEventListener('show', handleShow);
    popupEvent.addEventListener('confirm', handleConfirm);

    return () => {
      popupEvent.removeEventListener('show', handleShow);
      popupEvent.removeEventListener('confirm', handleConfirm);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const closePopup = () => setPopup(null);

  const handleConfirmClick = () => {
    if (popup?.onConfirm) {
      popup.onConfirm();
    }
    closePopup();
  };

  if (!popup) return null;

  const icons = {
    error: <AlertCircle className="text-red-500 w-12 h-12" />,
    success: <CheckCircle2 className="text-emerald-500 w-12 h-12" />,
    warning: <HelpCircle className="text-amber-500 w-12 h-12" />,
    info: <Info className="text-sky-500 w-12 h-12" />
  };

  const bgColors = {
    error: 'bg-red-50 border-red-100 text-red-900',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    warning: 'bg-amber-50 border-amber-100 text-amber-900',
    info: 'bg-sky-50 border-sky-100 text-sky-900'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={closePopup}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${bgColors[popup.type]} flex flex-col items-center text-center`}
        >
          <button 
            onClick={closePopup} 
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="mb-4 bg-white p-3 rounded-2xl shadow-sm border border-white/50">
            {icons[popup.type]}
          </div>
          
          <h3 className="text-lg font-bold mb-6 whitespace-pre-line">
            {popup.message}
          </h3>
          
          <div className="flex gap-3 w-full">
            {popup.isConfirm ? (
              <>
                <button 
                  onClick={closePopup}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmClick}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Confirm
                </button>
              </>
            ) : (
              <button 
                onClick={closePopup}
                className="w-full py-3 px-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Okay
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalPopup;
