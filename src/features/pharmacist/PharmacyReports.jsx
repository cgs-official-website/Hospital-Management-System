import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, Package, DollarSign, Activity, FileText } from 'lucide-react';

const PharmacyReports = () => {
  const hospitalId = localStorage.getItem('hospitalId');
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    billsCount: 0,
    inventoryValue: 0,
    totalItems: 0,
    lowStockCount: 0
  });

  const [recentBills, setRecentBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      if (!hospitalId) return;
      
      try {
        // Fetch Bills
        const billsQ = query(collection(db, 'pharmacy_bills'), where('hospitalId', '==', hospitalId));
        const billsSnap = await getDocs(billsQ);
        let sales = 0;
        let billsList = [];
        
        billsSnap.forEach(doc => {
          const data = doc.data();
          sales += data.total || 0;
          billsList.push({ id: doc.id, ...data });
        });
        
        // Fetch Inventory
        const invQ = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
        const invSnap = await getDocs(invQ);
        let invValue = 0;
        let itemsCount = 0;
        let lowStock = 0;
        
        invSnap.forEach(doc => {
          const data = doc.data();
          itemsCount++;
          invValue += (data.price || 0) * (data.stock || 0);
          if (data.stock < 50) lowStock++;
        });

        setMetrics({
          totalSales: sales,
          billsCount: billsSnap.size,
          inventoryValue: invValue,
          totalItems: itemsCount,
          lowStockCount: lowStock
        });

        setRecentBills(billsList.sort((a, b) => b.date?.seconds - a.date?.seconds));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [hospitalId]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-bold text-slate-800">Pharmacy Analytics</h2>
        <p className="text-sm text-slate-500">Overview of pharmacy performance and inventory health.</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Sales</p>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-800">₹{metrics.totalSales.toFixed(2)}</h3>
            <p className="text-sm text-emerald-600 font-bold mt-2">From {metrics.billsCount} bills</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Est. Inventory Value</p>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-800">₹{metrics.inventoryValue.toFixed(2)}</h3>
            <p className="text-sm text-slate-500 font-bold mt-2">Total assets in stock</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Items</p>
            <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-800">{metrics.totalItems}</h3>
            <p className="text-sm text-slate-500 font-bold mt-2">Distinct medicines</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Critical Stock</p>
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-800">{metrics.lowStockCount}</h3>
            <p className="text-sm text-orange-600 font-bold mt-2">Items below 50 units</p>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-primary" /> Recent Pharmacy Bills
          </h3>
          
          <div className="overflow-x-auto custom-scrollbar w-full">
            {(() => {
              const totalPages = Math.ceil(recentBills.length / itemsPerPage);
              const currentBills = recentBills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              
              return (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                        <th className="py-3 px-4 font-medium">Bill ID</th>
                        <th className="py-3 px-4 font-medium">Patient Name</th>
                        <th className="py-3 px-4 font-medium">Items</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBills.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-500">No bills generated yet.</td>
                        </tr>
                      ) : (
                        currentBills.map(bill => (
                          <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-xs text-slate-500">{bill.id.slice(0, 8)}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{bill.patientName}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{bill.items?.length || 0} items</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{new Date(bill.date?.seconds * 1000).toLocaleDateString()}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-800 text-right">₹{bill.total?.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 sticky bottom-0 z-10 gap-4">
                      <span className="text-sm font-medium text-slate-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, recentBills.length)} of {recentBills.length} entries
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                        >
                          Previous
                        </button>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 hover:text-primary transition-colors disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyReports;
