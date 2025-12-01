import React, { useState } from 'react';
import { AppState } from '../types';
import { Download, FileText, Image as ImageIcon, ArrowUpRight, ArrowDownLeft, Trash2, AlertTriangle } from 'lucide-react';

interface TransactionHistoryProps {
  data: AppState;
  onDeletePayment: (id: string) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ data, onDeletePayment }) => {
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const handleExportCSV = () => {
    // Flatten data for CSV
    const headers = ['Date', 'Type', 'Amount', 'Direction', 'Investment', 'Customer'];
    const rows = data.payments.map(p => {
      const inv = data.investments.find(i => i.id === p.investmentId);
      const cust = data.customers.find(c => c.id === inv?.customerId);
      const direction = p.type === 'lend' ? 'OUT' : 'IN';
      return [
        new Date(p.date).toISOString().split('T')[0],
        p.type,
        p.amount.toString(),
        direction,
        inv?.title || 'Unknown',
        cust?.name || 'Unknown'
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDeletePayment = () => {
    if (paymentToDelete) {
      onDeletePayment(paymentToDelete);
      setPaymentToDelete(null);
    }
  };

  const sortedPayments = [...data.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">History</h2>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 text-sm bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {sortedPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No transactions found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedPayments.map(p => {
               const inv = data.investments.find(i => i.id === p.investmentId);
               const cust = data.customers.find(c => c.id === inv?.customerId);
               const isMoneyOut = p.type === 'lend';
               
               return (
                 <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                   <div className="flex items-start space-x-3">
                     <div className={`mt-1 p-2 rounded-lg ${isMoneyOut ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                       {isMoneyOut ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                     </div>
                     <div>
                       <p className="text-sm font-semibold text-slate-800">{inv?.title || 'Unknown Investment'}</p>
                       <p className="text-xs text-slate-500">{cust?.name} • {isMoneyOut ? 'Money Given' : p.type}</p>
                       <p className="text-xs text-slate-400 mt-1">{new Date(p.date).toLocaleDateString()} {new Date(p.date).toLocaleTimeString()}</p>
                     </div>
                   </div>
                   <div className="flex items-center space-x-4">
                     <div className="text-right">
                       <p className={`font-bold ${isMoneyOut ? 'text-orange-600' : 'text-emerald-600'}`}>
                         {isMoneyOut ? '-' : '+'}Rs {p.amount.toLocaleString()}
                       </p>
                       {p.receiptImage && (
                         <span className="inline-flex items-center text-[10px] text-indigo-500 mt-1 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded-full">
                           <ImageIcon size={10} className="mr-1" /> Receipt
                         </span>
                       )}
                     </div>
                     <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPaymentToDelete(p.id);
                      }}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Delete Transaction"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Payments */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100">
            <div className="flex items-center space-x-3 mb-3 text-red-600">
               <div className="bg-red-50 p-2 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Delete Transaction?</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete this transaction record? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setPaymentToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePayment}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;