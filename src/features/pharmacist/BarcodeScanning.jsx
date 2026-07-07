import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ScanBarcode, Search, CheckCircle2, AlertCircle, Package } from 'lucide-react';

const BarcodeScanning = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [barcode, setBarcode] = useState('');
  const [scannedItem, setScannedItem] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto focus the input for barcode scanner hardware
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    
    setIsScanning(true);
    setError('');
    setScannedItem(null);

    try {
      // For simulation, we assume barcode is the exact medicine name or ID.
      // In real world, 'barcode' would be a specific field in the inventory doc.
      const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId), where('name', '==', barcode.trim()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setScannedItem({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setBarcode('');
      } else {
        setError(`No medicine found matching barcode: ${barcode}`);
      }
    } catch (err) {
      console.error(err);
      setError("Error querying database");
    } finally {
      setIsScanning(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="mb-8 shrink-0 text-center max-w-xl mx-auto w-full">
        <div className="w-16 h-16 bg-sky-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-sm">
          <ScanBarcode size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Barcode Scanning</h2>
        <p className="text-sm text-slate-500 mt-2">Scan a medicine's barcode to instantly view its inventory details.</p>
        
        <form onSubmit={handleScan} className="mt-8 relative">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Scan barcode or type exact medicine name and press Enter..." 
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-lg font-mono text-center focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={isScanning}
            autoComplete="off"
          />
          {isScanning && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-8 border-t border-slate-100">
        
        {!scannedItem && !error && (
          <div className="text-center text-slate-400 max-w-sm mt-8">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium text-lg">Awaiting Scan...</p>
            <p className="text-sm mt-1">Ensure your barcode scanner is connected and cursor is in the input field above.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {scannedItem && (
          <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-emerald-500 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <CheckCircle2 size={24} /> Match Found
                </div>
                <span className="bg-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Verified
                </span>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shrink-0">
                    <Package size={48} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-extrabold text-slate-800 mb-1">{scannedItem.name}</h3>
                    <p className="text-slate-500 font-medium mb-6">Category: {scannedItem.category}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                        <p className={`text-2xl font-extrabold ${scannedItem.stock < 50 ? 'text-red-500' : 'text-slate-800'}`}>
                          {scannedItem.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                        <p className="text-2xl font-extrabold text-slate-800">₹{scannedItem.price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expiry Date</p>
                        <p className="text-lg font-bold text-slate-700 mt-1">{scannedItem.expiry}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setScannedItem(null)} className="btn-secondary">Clear Result</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanning;
