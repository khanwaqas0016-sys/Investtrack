import React, { useState, useRef } from 'react';
import { AppState, Investment, Payment, Customer, generateUUID } from '../types';
import { Plus, Calendar, Upload, CheckCircle, Clock, ArrowRightCircle, ArrowLeftCircle, TrendingUp, Trash2, Pencil, X, Save, AlertTriangle, FileText, Printer, Mail, Phone, ArrowLeft, Wallet, Coins } from 'lucide-react';

interface InvestmentListProps {
  data: AppState;
  onAddInvestment: (inv: Investment) => void;
  onUpdateInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => boolean;
  onAddPayment: (pay: Payment) => void;
  onUpdatePayment: (pay: Payment) => void;
  onDeletePayment: (id: string) => void;
}

const InvestmentList: React.FC<InvestmentListProps> = ({ 
  data, 
  onAddInvestment, 
  onUpdateInvestment, 
  onDeleteInvestment, 
  onAddPayment,
  onUpdatePayment,
  onDeletePayment
}) => {
  const [viewState, setViewState] = useState<'list' | 'add_inv' | 'edit_inv' | 'add_pay' | 'edit_pay' | 'add_funds' | 'details' | 'report'>('list');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  
  // New/Edit Investment Form State
  const [invForm, setInvForm] = useState<Partial<Investment>>({});
  
  // New/Edit Payment Form State
  const [payForm, setPayForm] = useState<Partial<Payment>>({ type: 'installment' });
  
  // Add Funds (Lend) Form State
  const [addFundsAmount, setAddFundsAmount] = useState<number | ''>('');
  const [addFundsDate, setAddFundsDate] = useState<string>(new Date().toISOString());
  
  // Delete Confirmation State
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateProgress = (invId: string, total: number) => {
    // Only sum payments that are NOT 'lend' type (lend type is money OUT)
    const paid = data.payments
      .filter(p => p.investmentId === invId && p.type !== 'lend')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const expectedTotal = total * (1 + (data.investments.find(i => i.id === invId)?.expectedReturnRate || 0)/100);
    return { paid, percentage: expectedTotal > 0 ? Math.min((paid / expectedTotal) * 100, 100) : 0 };
  };

  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (invForm.title && invForm.amountInvested && invForm.customerId) {
      const investmentData: Investment = {
        id: viewState === 'edit_inv' && selectedInvestment ? selectedInvestment.id : generateUUID(),
        title: invForm.title,
        customerId: invForm.customerId,
        amountInvested: Number(invForm.amountInvested),
        expectedReturnRate: Number(invForm.expectedReturnRate || 0),
        startDate: invForm.startDate || new Date().toISOString(),
        endDate: invForm.endDate || new Date().toISOString(),
        status: (invForm.status || 'active') as 'active' | 'completed' | 'cancelled',
        notes: invForm.notes
      };

      if (viewState === 'edit_inv') {
        onUpdateInvestment(investmentData);
        setSelectedInvestment(investmentData);
        setViewState('details');
      } else {
        onAddInvestment(investmentData);
        setViewState('list');
      }
      setInvForm({});
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payForm.amount && selectedInvestment) {
      const paymentData: Payment = {
        id: viewState === 'edit_pay' && selectedPaymentId ? selectedPaymentId : generateUUID(),
        investmentId: selectedInvestment.id,
        amount: Number(payForm.amount),
        date: payForm.date || new Date().toISOString(),
        type: (payForm.type as any) || 'installment',
        receiptImage: payForm.receiptImage,
        notes: payForm.notes
      };

      if (viewState === 'edit_pay') {
        onUpdatePayment(paymentData);
      } else {
        onAddPayment(paymentData);
        if (window.showDollarAnimation) {
          window.showDollarAnimation("take");
        }
      }
      setViewState('details');
      setPayForm({ type: 'installment' });
      setSelectedPaymentId(null);
    }
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (addFundsAmount && selectedInvestment) {
      const amount = Number(addFundsAmount);
      const updatedInvestment = {
        ...selectedInvestment,
        amountInvested: selectedInvestment.amountInvested + amount
      };
      onUpdateInvestment(updatedInvestment);
      setSelectedInvestment(updatedInvestment); 

      const payment: Payment = {
        id: generateUUID(),
        investmentId: selectedInvestment.id,
        amount: amount,
        date: addFundsDate,
        type: 'lend',
        notes: 'Additional funds added'
      };
      onAddPayment(payment);

      if (window.showDollarAnimation) {
        window.showDollarAnimation("give");
      }

      setViewState('details');
      setAddFundsAmount('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayForm(prev => ({ ...prev, receiptImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditInvestment = () => {
    if (selectedInvestment) {
      setInvForm(selectedInvestment);
      setViewState('edit_inv');
    }
  };

  const startDeleteInvestment = (id: string) => {
    setInvestmentToDelete(id);
  };

  const confirmDeleteInvestment = () => {
    if (investmentToDelete) {
      onDeleteInvestment(investmentToDelete);
      if (selectedInvestment && selectedInvestment.id === investmentToDelete) {
        setSelectedInvestment(null);
        setViewState('list');
      }
      setInvestmentToDelete(null);
    }
  };

  const confirmDeletePayment = () => {
    if (paymentToDelete) {
      onDeletePayment(paymentToDelete);
      setPaymentToDelete(null);
    }
  };

  const startEditPayment = (payment: Payment) => {
    setPayForm(payment);
    setSelectedPaymentId(payment.id);
    setViewState('edit_pay');
  };

  const renderContent = () => {
    // RENDER: Add / Edit Investment Form
    if (viewState === 'add_inv' || viewState === 'edit_inv') {
      return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
          <h2 className="text-xl font-bold mb-6 text-slate-800">{viewState === 'edit_inv' ? 'Edit Account' : 'New Account'}</h2>
          <form onSubmit={handleSaveInvestment} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Customer</label>
              <select 
                required
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                value={invForm.customerId || ''}
                onChange={e => setInvForm({...invForm, customerId: e.target.value})}
                disabled={viewState === 'edit_inv'}
              >
                <option value="">Select Customer</option>
                {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Title</label>
              <input 
                required type="text" placeholder="e.g. Personal Loan"
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                value={invForm.title || ''}
                onChange={e => setInvForm({...invForm, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Principal (Rs)</label>
                <input 
                  required type="number"
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  value={invForm.amountInvested || ''}
                  onChange={e => setInvForm({...invForm, amountInvested: parseFloat(e.target.value)})}
                />
              </div>
               <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Rate (%)</label>
                <input 
                  required type="number"
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  value={invForm.expectedReturnRate || ''}
                  onChange={e => setInvForm({...invForm, expectedReturnRate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Start Date</label>
                <input 
                  required type="date"
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  value={invForm.startDate ? invForm.startDate.split('T')[0] : ''}
                  onChange={e => setInvForm({...invForm, startDate: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() })}
                />
              </div>
               <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">End Date</label>
                <input 
                  required type="date"
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  value={invForm.endDate ? invForm.endDate.split('T')[0] : ''}
                  onChange={e => setInvForm({...invForm, endDate: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Notes (Optional)</label>
              <textarea 
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none h-32"
                placeholder="Add any additional details about this investment..."
                value={invForm.notes || ''}
                onChange={e => setInvForm({...invForm, notes: e.target.value})}
              />
            </div>

            {viewState === 'edit_inv' && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Status</label>
                <select
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  value={invForm.status || 'active'}
                  onChange={e => setInvForm({...invForm, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={() => setViewState(viewState === 'edit_inv' ? 'details' : 'list')} className="flex-1 py-4 bg-slate-100 rounded-xl font-medium text-slate-600">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">{viewState === 'edit_inv' ? 'Save Changes' : 'Create Account'}</button>
            </div>
          </form>
        </div>
      );
    }

    // RENDER: Add / Edit Payment Form
    if ((viewState === 'add_pay' || viewState === 'edit_pay') && selectedInvestment) {
      const isMoneyOut = payForm.type === 'lend';
      const themeClass = isMoneyOut ? 'border-orange-200 bg-orange-50/30 ring-orange-200' : 'border-emerald-200 bg-emerald-50/30 ring-emerald-200';
      const btnClass = isMoneyOut ? 'bg-orange-600 shadow-orange-200' : 'bg-emerald-600 shadow-emerald-200';
      const titleColor = isMoneyOut ? 'text-orange-600' : 'text-emerald-600';
      
      return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
          <h2 className={`text-xl font-bold mb-2 ${titleColor}`}>{viewState === 'edit_pay' ? 'Edit Transaction' : 'Receive Payment'}</h2>
          <p className="text-sm text-slate-500 mb-6">
            {viewState === 'edit_pay' ? 'Modify transaction for:' : 'Record money received for:'} <b>{selectedInvestment.title}</b>
          </p>
          <form onSubmit={handleSavePayment} className="space-y-4">
             <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Amount (Rs)</label>
              <input 
                required type="number"
                className={`w-full p-4 border rounded-xl focus:bg-white focus:ring-2 outline-none ${themeClass}`}
                value={payForm.amount || ''}
                onChange={e => setPayForm({...payForm, amount: parseFloat(e.target.value)})}
              />
            </div>
             <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Date</label>
              <input 
                required type="date"
                className={`w-full p-4 border rounded-xl focus:bg-white focus:ring-2 outline-none ${themeClass}`}
                value={payForm.date ? payForm.date.split('T')[0] : new Date().toISOString().split('T')[0]}
                onChange={e => setPayForm({...payForm, date: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Type</label>
               <select
                  className={`w-full p-4 border rounded-xl focus:bg-white outline-none ${themeClass}`}
                  value={payForm.type || 'installment'}
                  onChange={e => setPayForm({...payForm, type: e.target.value as any})}
                  disabled={viewState === 'edit_pay' && payForm.type === 'lend'}
                >
                  <option value="installment">Installment</option>
                  <option value="downpayment">Down Payment</option>
                  <option value="final_settlement">Final Settlement</option>
                  {viewState === 'edit_pay' && <option value="lend">Money Given (Lend)</option>}
                </select>
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-600 mb-2">Receipt</label>
               <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isMoneyOut ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-600' : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600'}`}
               >
                 {payForm.receiptImage ? (
                   <div className="relative">
                      <img src={payForm.receiptImage} alt="Receipt" className="h-24 object-contain rounded-lg shadow-sm" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPayForm({...payForm, receiptImage: undefined})}} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-sm"><X size={12}/></button>
                   </div>
                 ) : (
                   <>
                     <Upload size={24} className="mb-2" />
                     <span className="text-sm font-medium">Tap to upload receipt</span>
                   </>
                 )}
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={() => setViewState('details')} className="flex-1 py-4 bg-slate-100 rounded-xl font-medium text-slate-600">Cancel</button>
              <button type="submit" className={`flex-1 py-4 text-white rounded-xl font-bold shadow-lg ${btnClass}`}>Save Transaction</button>
            </div>
          </form>
        </div>
      );
    }

    // RENDER: Add Funds Form (Give Money)
    if (viewState === 'add_funds' && selectedInvestment) {
      return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
          <h2 className="text-xl font-bold mb-2 text-orange-600">Give Money</h2>
          <p className="text-sm text-slate-500 mb-6">Add more capital to: <b>{selectedInvestment.title}</b></p>
          <form onSubmit={handleAddFunds} className="space-y-5">
             <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Amount to Give (Rs)</label>
              <input 
                required type="number"
                className="w-full p-4 border border-orange-200 rounded-xl bg-orange-50/30 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none"
                value={addFundsAmount}
                onChange={e => setAddFundsAmount(parseFloat(e.target.value))}
              />
            </div>
             <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Date</label>
              <input 
                required type="date"
                className="w-full p-4 border border-orange-200 rounded-xl bg-orange-50/30 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none"
                value={addFundsDate.split('T')[0]}
                onChange={e => setAddFundsDate(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={() => setViewState('details')} className="flex-1 py-4 bg-slate-100 rounded-xl font-medium text-slate-600">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200">Add Funds</button>
            </div>
          </form>
        </div>
      );
    }

    // RENDER: Report View
    if (viewState === 'report' && selectedInvestment) {
      const customer = data.customers.find(c => c.id === selectedInvestment.customerId);
      const relatedPayments = data.payments.filter(p => p.investmentId === selectedInvestment.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const totalPaid = relatedPayments
        .filter(p => p.type !== 'lend')
        .reduce((sum, p) => sum + p.amount, 0);

      const expectedReturn = selectedInvestment.amountInvested * (1 + selectedInvestment.expectedReturnRate / 100);
      const remaining = expectedReturn - totalPaid;

      return (
        <div className="bg-white min-h-screen animate-fade-in absolute inset-0 z-50 flex flex-col">
          {/* Navigation - Print hidden */}
          <div className="print:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
             <button onClick={() => setViewState('details')} className="flex items-center text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                 <ArrowLeft size={20} className="mr-2"/> Back
             </button>
             <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full flex items-center shadow-lg hover:bg-indigo-700 font-medium transition-colors">
                 <Printer size={18} className="mr-2"/> Print Statement
             </button>
          </div>
         
          {/* Report Content */}
          <div className="flex-1 overflow-auto bg-slate-50 print:bg-white p-4 md:p-8">
             <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2rem] shadow-sm print:shadow-none print:p-0" id="printable-report">
                 {/* Header */}
                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                     <div>
                         <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Statement</h1>
                         <p className="text-slate-500 mt-2 font-medium">Date: {new Date().toLocaleDateString()}</p>
                     </div>
                     <div className="text-right">
                         <h2 className="text-xl font-bold text-indigo-600">InvestTrack Pro</h2>
                         <p className="text-sm text-slate-500 font-medium">Portfolio Management</p>
                     </div>
                 </div>
                 
                 {/* Summary Boxes */}
                 <div className="grid grid-cols-3 gap-6 mb-12">
                     <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50">
                         <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-wider">Total Principal</p>
                         <p className="text-2xl font-bold text-slate-900">Rs {selectedInvestment.amountInvested.toLocaleString()}</p>
                     </div>
                     <div className="p-6 border border-slate-100 rounded-2xl bg-emerald-50/50">
                         <p className="text-xs text-emerald-600 uppercase font-bold mb-2 tracking-wider">Total Repaid</p>
                         <p className="text-2xl font-bold text-emerald-700">Rs {totalPaid.toLocaleString()}</p>
                     </div>
                     <div className="p-6 border border-slate-100 rounded-2xl bg-indigo-50/50">
                         <p className="text-xs text-indigo-600 uppercase font-bold mb-2 tracking-wider">Balance Due</p>
                         <p className="text-2xl font-bold text-indigo-700">Rs {Math.max(0, remaining).toLocaleString()}</p>
                     </div>
                 </div>
                 
                 {/* Transactions Table */}
                 <div className="mb-8">
                     <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 mb-6">Transaction History</h3>
                     <div className="overflow-hidden rounded-2xl border border-slate-200">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                 <tr>
                                     <th className="py-4 px-6 font-bold tracking-wider">Date</th>
                                     <th className="py-4 px-6 font-bold tracking-wider">Description</th>
                                     <th className="py-4 px-6 font-bold tracking-wider text-right">Amount</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 bg-white">
                                 {relatedPayments.length === 0 ? (
                                     <tr><td colSpan={3} className="py-6 px-6 text-center text-slate-400 italic">No transactions recorded</td></tr>
                                 ) : (
                                     relatedPayments.map(p => {
                                        const isMoneyOut = p.type === 'lend';
                                        return (
                                         <tr key={p.id}>
                                             <td className="py-4 px-6 text-slate-600 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                                             <td className="py-4 px-6">
                                                 <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                     isMoneyOut
                                                     ? 'bg-orange-100 text-orange-700' 
                                                     : 'bg-emerald-100 text-emerald-700'
                                                 }`}>
                                                     {isMoneyOut ? 'Money Given' : p.type.replace('_', ' ')}
                                                 </span>
                                                 {p.notes && <span className="ml-3 text-slate-400 text-xs font-medium">{p.notes}</span>}
                                             </td>
                                             <td className={`py-4 px-6 text-right font-bold ${isMoneyOut ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                 {isMoneyOut ? '-' : '+'}Rs {p.amount.toLocaleString()}
                                             </td>
                                         </tr>
                                        );
                                     })
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>
                 
                 {/* Footer */}
                 <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                     <p className="font-bold text-slate-500">InvestTrack Pro</p>
                     <p>Generated automatically.</p>
                 </div>
             </div>
          </div>
        </div>
      );
    }

    // RENDER: Investment Details
    if (viewState === 'details' && selectedInvestment) {
      const customer = data.customers.find(c => c.id === selectedInvestment.customerId);
      const relatedPayments = data.payments.filter(p => p.investmentId === selectedInvestment.id);
      
      const totalPaid = relatedPayments
        .filter(p => p.type !== 'lend')
        .reduce((sum, p) => sum + p.amount, 0);

      const expectedReturn = selectedInvestment.amountInvested * (1 + selectedInvestment.expectedReturnRate / 100);
      const balance = expectedReturn - totalPaid;

      return (
        <div className="space-y-6 animate-fade-in relative pb-8">
          <div className="flex justify-between items-center px-1">
             <button onClick={() => setViewState('list')} className="text-sm text-indigo-600 font-bold flex items-center hover:underline"><ArrowLeftCircle size={18} className="mr-1.5"/> Back to List</button>
             <button 
               onClick={() => setViewState('report')} 
               className="text-sm bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-full flex items-center hover:bg-slate-50 shadow-sm transition-all"
             >
               <FileText size={16} className="mr-2 text-indigo-500"/> Report
             </button>
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="z-10">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-extrabold text-slate-900">{selectedInvestment.title}</h2>
                  <div className="flex space-x-1">
                    <button onClick={startEditInvestment} className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-2 rounded-full transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => startDeleteInvestment(selectedInvestment.id)} className="text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="text-slate-500 font-medium mt-1">{customer?.name}</p>
              </div>
              <span className={`px-4 py-1.5 text-xs font-bold rounded-full z-10 uppercase tracking-wide ${selectedInvestment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {selectedInvestment.status}
              </span>
              
              {/* Decorative background blob */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 z-0 pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-slate-50 p-5 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Given</p>
                <p className="text-xl font-bold text-slate-800">Rs {selectedInvestment.amountInvested.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-2xl">
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">Expected Return</p>
                <p className="text-xl font-bold text-indigo-700">Rs {expectedReturn.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Received</p>
                <p className="text-xl font-bold text-emerald-700">Rs {totalPaid.toLocaleString()}</p>
              </div>
               <div className="bg-amber-50 p-5 rounded-2xl">
                <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-xl font-bold text-amber-700">Rs {Math.max(0, balance).toLocaleString()}</p>
              </div>
            </div>

            {selectedInvestment.notes && (
              <div className="bg-slate-50 p-5 rounded-2xl mb-6 relative z-10 border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedInvestment.notes}</p>
              </div>
            )}

            <div className="flex space-x-4 relative z-10">
               <button 
                onClick={() => setViewState('add_funds')}
                className="flex-1 py-4 bg-orange-50 text-orange-700 rounded-2xl font-bold hover:bg-orange-100 transition-colors flex items-center justify-center group"
              >
                <div className="bg-orange-200 p-1.5 rounded-full mr-2 group-hover:bg-orange-300 transition-colors">
                    <ArrowRightCircle size={18} className="text-orange-700" />
                </div>
                Give Money
              </button>
              <button 
                onClick={() => setViewState('add_pay')}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center justify-center group"
              >
                <div className="bg-emerald-500/50 p-1.5 rounded-full mr-2 group-hover:bg-emerald-500 transition-colors">
                    <ArrowLeftCircle size={18} className="text-white" />
                </div>
                Take Money
              </button>
            </div>
          </div>

          <h3 className="font-bold text-slate-800 text-lg px-2">Transaction Log</h3>
          <div className="space-y-3">
            {relatedPayments.length === 0 ? <p className="text-slate-400 text-sm px-2 italic">No transactions recorded.</p> : null}
            {[...relatedPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => {
               const isMoneyOut = p.type === 'lend';
               return (
                <div key={p.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:scale-[1.01] transition-transform shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${isMoneyOut ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isMoneyOut ? <TrendingUp size={20} className="rotate-45" /> : <CheckCircle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                         <p className={`font-bold text-sm ${isMoneyOut ? 'text-orange-700' : 'text-slate-800'}`}>
                          {isMoneyOut ? 'Money Given' : 'Payment Received'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-extrabold ${isMoneyOut ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {isMoneyOut ? '-' : '+'}Rs {p.amount.toLocaleString()}
                      </p>
                      {p.receiptImage && (
                         <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide cursor-pointer hover:underline">View Receipt</span>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1 ml-2 pl-3 border-l border-slate-100">
                       <button onClick={() => startEditPayment(p)} className="text-slate-300 hover:text-indigo-500 transition-colors"><Pencil size={16} /></button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); setPaymentToDelete(p.id); }} 
                        className="text-slate-300 hover:text-red-500 transition-colors"
                       >
                        <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // RENDER: List
    return (
      <div className="space-y-6 animate-fade-in relative pb-10">
        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Accounts</h2>
            <p className="text-slate-500 font-medium text-sm">Manage your portfolio</p>
          </div>
          <button 
            onClick={() => { setInvForm({}); setViewState('add_inv'); }}
            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-300 hover:bg-indigo-700 transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4">
          {data.investments.length === 0 ? (
             <div className="text-center py-16 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
               <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                 <Wallet size={32} className="text-slate-300" />
               </div>
               <p className="font-medium">No accounts tracked yet.</p>
               <button onClick={() => { setInvForm({}); setViewState('add_inv'); }} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">Create your first account</button>
             </div>
          ) : (
            data.investments.map(inv => {
              const progress = calculateProgress(inv.id, inv.amountInvested);
              const customer = data.customers.find(c => c.id === inv.customerId);
              return (
                <div 
                  key={inv.id} 
                  onClick={() => { setSelectedInvestment(inv); setViewState('details'); }}
                  className="bg-white p-6 rounded-[2rem] shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-slate-100 cursor-pointer active:scale-[0.99] transition-all hover:shadow-md relative group overflow-hidden"
                >
                   <button
                      onClick={(e) => {
                          e.stopPropagation();
                          startDeleteInvestment(inv.id);
                      }}
                      className="absolute top-5 right-5 text-slate-300 hover:text-red-500 bg-white border border-slate-100 rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                      title="Delete Account"
                  >
                      <Trash2 size={16} />
                  </button>
                  
                  <div className="flex justify-between items-start mb-3 pr-10 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{inv.title}</h3>
                      <p className="text-sm font-medium text-slate-500">{customer?.name}</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{progress.percentage.toFixed(0)}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4 relative z-10">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress.percentage}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-semibold text-slate-400 relative z-10">
                    <span className="flex items-center"><Calendar size={12} className="mr-1.5"/> {new Date(inv.endDate).toLocaleDateString()}</span>
                    <span className="flex items-center text-slate-600"><Coins size={12} className="mr-1.5 text-indigo-500"/> Rs {progress.paid.toLocaleString()} <span className="text-slate-300 mx-1">/</span> Rs {(inv.amountInvested * (1 + inv.expectedReturnRate/100)).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Delete Confirmation Modal for Investments */}
      {investmentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center mb-6">
               <div className="bg-red-50 p-4 rounded-full mb-4">
                 <AlertTriangle size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
               <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  You are about to delete <b>{data.investments.find(i => i.id === investmentToDelete)?.title}</b>. This will permanently remove all associated data.
               </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setInvestmentToDelete(null)}
                className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteInvestment}
                className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Payments */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center mb-6">
               <div className="bg-red-50 p-4 rounded-full mb-4">
                 <AlertTriangle size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Delete Transaction?</h3>
               <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  This action cannot be undone. Are you sure you want to remove this record?
               </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setPaymentToDelete(null)}
                className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePayment}
                className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvestmentList;