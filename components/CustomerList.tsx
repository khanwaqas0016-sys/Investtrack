import React, { useState, useRef } from 'react';
import { AppState, Customer, generateUUID } from '../types';
import { Plus, Search, Phone, Mail, User, Camera, X, Pencil, Trash2, AlertTriangle, FileText, Printer, ArrowLeft, Wallet } from 'lucide-react';

interface CustomerListProps {
  data: AppState;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ 
  data, 
  onAddCustomer, 
  onUpdateCustomer,
  onDeleteCustomer 
}) => {
  const [viewState, setViewState] = useState<'list' | 'form' | 'report'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<Partial<Customer>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState<Customer | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.name && formState.phone) {
      const customer: Customer = {
        id: isEditing && formState.id ? formState.id : generateUUID(),
        name: formState.name,
        email: formState.email || '',
        phone: formState.phone,
        joinedDate: formState.joinedDate || new Date().toISOString(),
        profileImage: formState.profileImage
      };

      if (isEditing) {
        onUpdateCustomer(customer);
      } else {
        onAddCustomer(customer);
      }
      setViewState('list');
      setFormState({});
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormState(customer);
    setIsEditing(true);
    setViewState('form');
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete);
      setCustomerToDelete(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openReport = (customer: Customer) => {
    setSelectedCustomerForReport(customer);
    setViewState('report');
  };

  // Filter customers
  const filteredCustomers = data.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // Render List View
  if (viewState === 'list') {
    return (
      <div className="space-y-6 animate-fade-in relative pb-10">
        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">People</h2>
            <p className="text-slate-500 font-medium text-sm">Manage your clients</p>
          </div>
          <button 
            onClick={() => { setFormState({}); setIsEditing(false); setViewState('form'); }}
            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-300 hover:bg-indigo-700 transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-3">
          <Search size={20} className="text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search name or phone..." 
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
               <User size={48} className="mx-auto text-slate-200 mb-3" />
               <p>No customers found.</p>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              // Calculate stats for this customer
              const customerInvestments = data.investments.filter(i => i.customerId === customer.id);
              const activeInvestments = customerInvestments.filter(i => i.status === 'active').length;
              const totalInvested = customerInvestments.reduce((sum, i) => sum + i.amountInvested, 0);
              
              return (
                <div key={customer.id} className="bg-white p-5 rounded-[2rem] shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {customer.profileImage ? (
                        <img src={customer.profileImage} alt={customer.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 leading-tight">{customer.name}</h3>
                      <div className="flex flex-col text-xs text-slate-500 font-medium mt-1">
                        <span className="flex items-center mb-0.5"><Phone size={10} className="mr-1"/> {customer.phone}</span>
                        {activeInvestments > 0 ? (
                           <span className="text-emerald-600 font-bold">{activeInvestments} Active • Rs {totalInvested.toLocaleString()}</span>
                        ) : (
                           <span className="text-slate-400">No active investments</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openReport(customer)}
                      className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="View Report"
                    >
                      <FileText size={18} />
                    </button>
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setCustomerToDelete(customer.id)}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {customerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="bg-red-50 p-4 rounded-full mb-4">
                   <AlertTriangle size={32} className="text-red-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Delete Customer?</h3>
                 <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    This will delete <b>{data.customers.find(c => c.id === customerToDelete)?.name}</b> and ALL their associated investments and transaction history.
                 </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Form View
  if (viewState === 'form') {
    return (
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
        <h2 className="text-xl font-bold mb-6 text-slate-800">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
        
        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile Image Upload */}
          <div className="flex justify-center mb-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-28 w-28 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-300 transition-all"
            >
              {formState.profileImage ? (
                <img src={formState.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold mt-1">Upload</span>
                </div>
              )}
              {formState.profileImage && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={20} className="text-white" />
                </div>
              )}
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
            <input 
              required type="text" 
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              value={formState.name || ''}
              onChange={e => setFormState({...formState, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Phone Number</label>
            <input 
              required type="tel" 
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              value={formState.phone || ''}
              onChange={e => setFormState({...formState, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Email (Optional)</label>
            <input 
              type="email" 
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              value={formState.email || ''}
              onChange={e => setFormState({...formState, email: e.target.value})}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="button" 
              onClick={() => setViewState('list')} 
              className="flex-1 py-4 bg-slate-100 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render Report View
  if (viewState === 'report' && selectedCustomerForReport) {
    const customer = selectedCustomerForReport;
    const customerInvestments = data.investments.filter(i => i.customerId === customer.id);
    const investmentIds = customerInvestments.map(i => i.id);
    
    // Calculate Summary Stats
    const totalPrincipal = customerInvestments.reduce((sum, i) => sum + i.amountInvested, 0);
    const totalRepaid = data.payments
      .filter(p => investmentIds.includes(p.investmentId) && p.type !== 'lend')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalExpectedReturn = customerInvestments.reduce((sum, i) => {
        return sum + (i.amountInvested * (1 + i.expectedReturnRate / 100));
    }, 0);
    
    const balanceDue = totalExpectedReturn - totalRepaid;

    return (
      <div className="bg-white min-h-screen animate-fade-in absolute inset-0 z-50 flex flex-col">
          {/* Navigation - Print hidden */}
          <div className="print:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
             <button onClick={() => setViewState('list')} className="flex items-center text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                 <ArrowLeft size={20} className="mr-2"/> Back
             </button>
             <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full flex items-center shadow-lg hover:bg-indigo-700 font-medium transition-colors">
                 <Printer size={18} className="mr-2"/> Print Report
             </button>
          </div>
         
          {/* Report Content */}
          <div className="flex-1 overflow-auto bg-slate-50 print:bg-white p-4 md:p-8">
             <div className="max-w-4xl mx-auto bg-white p-10 rounded-[2rem] shadow-sm print:shadow-none print:p-0" id="printable-report">
                 
                 {/* Header */}
                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                     <div className="flex items-center space-x-6">
                        <div className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 print:border-slate-300">
                          {customer.profileImage ? (
                            <img src={customer.profileImage} alt={customer.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <User size={32} />
                            </div>
                          )}
                        </div>
                        <div>
                           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{customer.name}</h1>
                           <div className="text-slate-500 mt-2 text-sm space-y-1">
                              <p className="flex items-center"><Phone size={12} className="mr-2"/> {customer.phone}</p>
                              {customer.email && <p className="flex items-center"><Mail size={12} className="mr-2"/> {customer.email}</p>}
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                         <h2 className="text-xl font-bold text-indigo-600">InvestTrack Pro</h2>
                         <p className="text-sm text-slate-500 font-medium">Customer Statement</p>
                         <p className="text-xs text-slate-400 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                     </div>
                 </div>
                 
                 {/* Financial Overview */}
                 <div className="grid grid-cols-3 gap-6 mb-12">
                     <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 print:border-slate-200">
                         <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-wider">Total Invested</p>
                         <p className="text-2xl font-bold text-slate-900">Rs {totalPrincipal.toLocaleString()}</p>
                     </div>
                     <div className="p-6 border border-slate-100 rounded-2xl bg-emerald-50/50 print:bg-white print:border-emerald-200">
                         <p className="text-xs text-emerald-600 uppercase font-bold mb-2 tracking-wider">Total Repaid</p>
                         <p className="text-2xl font-bold text-emerald-700">Rs {totalRepaid.toLocaleString()}</p>
                     </div>
                     <div className="p-6 border border-slate-100 rounded-2xl bg-indigo-50/50 print:bg-white print:border-indigo-200">
                         <p className="text-xs text-indigo-600 uppercase font-bold mb-2 tracking-wider">Net Balance Due</p>
                         <p className="text-2xl font-bold text-indigo-700">Rs {Math.max(0, balanceDue).toLocaleString()}</p>
                     </div>
                 </div>
                 
                 {/* Detailed Breakdown */}
                 <div className="space-y-10">
                    <h3 className="text-xl font-bold text-slate-900">Portfolio Breakdown</h3>
                    
                    {customerInvestments.length === 0 ? (
                        <p className="text-slate-400 italic">No investments on record.</p>
                    ) : (
                        customerInvestments.map(inv => {
                            const payments = data.payments.filter(p => p.investmentId === inv.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                            const invRepaid = payments.filter(p => p.type !== 'lend').reduce((sum, p) => sum + p.amount, 0);
                            const invExpected = inv.amountInvested * (1 + inv.expectedReturnRate/100);
                            
                            return (
                                <div key={inv.id} className="break-inside-avoid">
                                    <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800">{inv.title}</h4>
                                            <p className="text-xs text-slate-500">
                                                {new Date(inv.startDate).toLocaleDateString()} - {new Date(inv.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <span className="text-slate-500">Principal: <b>Rs {inv.amountInvested.toLocaleString()}</b></span>
                                            <span className="mx-2 text-slate-300">|</span>
                                            <span className="text-emerald-600">Repaid: <b>Rs {invRepaid.toLocaleString()}</b></span>
                                        </div>
                                    </div>
                                    
                                    <table className="w-full text-sm text-left mb-2">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                                            <tr>
                                                <th className="py-2 px-4">Date</th>
                                                <th className="py-2 px-4">Type</th>
                                                <th className="py-2 px-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payments.length === 0 ? (
                                                <tr><td colSpan={3} className="py-3 px-4 text-center text-slate-400">No transactions</td></tr>
                                            ) : (
                                                payments.map(p => {
                                                    const isMoneyOut = p.type === 'lend';
                                                    return (
                                                        <tr key={p.id}>
                                                            <td className="py-2 px-4 text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                                                            <td className="py-2 px-4 capitalize">
                                                                <span className={isMoneyOut ? 'text-orange-600 font-medium' : 'text-slate-700'}>
                                                                    {isMoneyOut ? 'Money Given' : p.type.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className={`py-2 px-4 text-right font-medium ${isMoneyOut ? 'text-orange-600' : 'text-slate-700'}`}>
                                                                {isMoneyOut ? '-' : ''}Rs {p.amount.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })
                    )}
                 </div>

                 <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                     <p>End of Report • InvestTrack Pro</p>
                 </div>
             </div>
          </div>
      </div>
    );
  }

  return null;
};

export default CustomerList;