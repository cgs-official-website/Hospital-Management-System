import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Receipt } from 'lucide-react';
import { showPopup } from '../../utils/popup';

const MedicineBilling = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [patientName, setPatientName] = useState('Walk-in Patient');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
      const snap = await getDocs(q);
      const allMeds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = allMeds.filter(m => m.name.toLowerCase().includes(val.toLowerCase()));
      setSearchResults(filtered);
    } catch(err) {
      console.error(err);
    }
  };

  const addToCart = (med) => {
    if (med.stock <= 0) {
      showPopup("Out of stock!", "error");
      return;
    }
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.qty >= med.stock) {
        showPopup("Cannot exceed available stock", "error");
        return;
      }
      setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) {
          showPopup("Cannot exceed available stock", "error");
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeRow = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Create bill
      await addDoc(collection(db, 'pharmacy_bills'), {
        hospitalId,
        patientName,
        items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price, total: c.qty * c.price })),
        subtotal,
        tax,
        total,
        date: serverTimestamp()
      });

      // 2. Deduct stock
      for (const item of cart) {
        await updateDoc(doc(db, 'inventory', item.id), {
          stock: item.stock - item.qty
        });
      }

      showPopup("Payment processed and bill generated!", "success");
      setCart([]);
      setPatientName('Walk-in Patient');
    } catch (error) {
      console.error(error);
      showPopup("Failed to process payment", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Left: POS Terminal */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Point of Sale</h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search medicines to add..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl max-h-64 overflow-y-auto z-10 p-2">
                {searchResults.map(res => (
                  <button 
                    key={res.id} 
                    onClick={() => addToCart(res)}
                    className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{res.name}</p>
                      <p className="text-xs text-slate-500">Stock: {res.stock} • ₹{res.price}</p>
                    </div>
                    <Plus size={16} className="text-primary"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} className="mb-4 text-slate-300" />
              <p className="font-medium text-lg">Cart is empty</p>
              <p className="text-sm mt-1">Search and add medicines to begin billing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-sm font-medium text-slate-500">₹{item.price.toFixed(2)} / unit</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                      <button onClick={() => updateQty(item.id, -1)} className="p-2 text-slate-500 hover:text-slate-800"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-slate-700 text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-2 text-slate-500 hover:text-slate-800"><Plus size={14}/></button>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-bold text-slate-800">₹{(item.price * item.qty).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeRow(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Checkout Panel */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2"><Receipt size={20} className="text-primary"/> Bill Summary</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Patient Name / ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-dashed border-slate-200 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax (5%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-extrabold text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 mt-auto">
          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              cart.length === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-sky-500 text-white shadow-lg shadow-sky-200'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><CreditCard size={18} /> Process Payment</>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default MedicineBilling;
