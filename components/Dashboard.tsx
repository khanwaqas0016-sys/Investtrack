
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppState } from '../types';
import { TrendingUp, Wallet, Banknote, ArrowUpRight, Sparkles, Users, User, Clock, CheckCircle2, Info } from 'lucide-react';

// Added missing interface to fix the error in Dashboard component definition
interface DashboardProps {
  data: AppState;
}

const StatCard = ({ title, value, subValue, icon: Icon, theme, percentage }: any) => {
  const themes = {
    blue: { 
      bg: 'bg-blue-50', text: 'text-blue-600', sub: 'text-blue-600/80', 
      iconBg: 'bg-blue-100', hoverBorder: 'hover:border-blue-200' 
    },
    emerald: { 
      bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'text-emerald-600/80', 
      iconBg: 'bg-emerald-100', hoverBorder: 'hover:border-emerald-200' 
    },
    violet: { 
      bg: 'bg-violet-50', text: 'text-violet-600', sub: 'text-violet-600/80', 
      iconBg: 'bg-violet-100', hoverBorder: 'hover:border-violet-200' 
    },
    amber: { 
      bg: 'bg-amber-50', text: 'text-amber-600', sub: 'text-amber-600/80', 
      iconBg: 'bg-amber-100', hoverBorder: 'hover:border-amber-200' 
    },
  };
  // @ts-ignore
  const t = themes[theme] || themes.blue;

  return (
    <div className={`
      bg-white p-5 md:p-6 rounded-[2rem] 
      shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] active:scale-[0.98]
      border border-slate-100 ${t.hoverBorder}
      transition-all duration-300 group cursor-default
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${t.iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={t.text} size={22} strokeWidth={2.5} />
        </div>
        {percentage !== undefined && (
          <div className={`flex flex-col items-end`}>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${percentage >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} flex items-center gap-1 border border-current opacity-80`}>
              {percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 mb-1 tracking-widest uppercase text-[9px] font-black">{title}</p>
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight transition-colors truncate">{value}</h3>
        {subValue && (
           <p className={`text-[10px] font-bold mt-1 ${t.sub} flex items-center gap-1 opacity-80 uppercase tracking-tighter`}>
             <Info size={10} /> {subValue}
           </p>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [contributorTab, setContributorTab] = useState<'paid' | 'unpaid'>('paid');

  const totalInvested = data.investments.reduce((sum, i) => sum + i.amountInvested, 0);
  
  const totalCollected = data.payments
    .filter(p => p.type !== 'lend')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalExpectedReturn = data.investments.reduce((sum, i) => {
    const expected = i.manualReturnAmount
      ? i.manualReturnAmount
      : i.amountInvested * (1 + i.expectedReturnRate / 100);
    return sum + expected;
  }, 0);

  // Requirement: Profit = total Expected Return - total Investment Amount
  const totalProjectedProfit = totalExpectedReturn - totalInvested;
  
  // New Requirement: Total Amounts Need to Collect = Sum of Remaining of all customers
  const totalRemainingToCollect = Math.max(0, totalExpectedReturn - totalCollected);
  
  // Mobile-friendly ROI (Return on Investment) calculation
  const roiPercentage = totalInvested > 0 ? (totalProjectedProfit / totalInvested) * 100 : 0;
  
  // Realized collection percentage (how much of the expected return we've actually got)
  const collectionRate = totalExpectedReturn > 0 ? (totalCollected / totalExpectedReturn) * 100 : 0;

  const chartData = React.useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = 0;
    }

    data.payments.forEach(p => {
      const d = new Date(p.date);
      const key = d.toLocaleString('default', { month: 'short' });
      if (months[key] !== undefined && p.type !== 'lend') {
        months[key] += p.amount;
      }
    });

    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [data.payments]);

  const currentMonthContributors = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const contributors: Record<string, { name: string; amount: number; profileImage?: string }> = {};

    data.payments.forEach(p => {
      const pDate = new Date(p.date);
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear && p.type !== 'lend') {
        const investment = data.investments.find(i => i.id === p.investmentId);
        if (investment) {
          const customer = data.customers.find(c => c.id === investment.customerId);
          if (customer) {
            if (!contributors[customer.id]) {
              contributors[customer.id] = { name: customer.name, amount: 0, profileImage: customer.profileImage };
            }
            contributors[customer.id].amount += p.amount;
          }
        }
      }
    });

    return Object.values(contributors).sort((a, b) => b.amount - a.amount);
  }, [data.payments, data.investments, data.customers]);

  const unpaidDistributors = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const paidCustomerIds = new Set(
      data.payments
        .filter(p => {
          const pDate = new Date(p.date);
          return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear && p.type !== 'lend';
        })
        .map(p => {
          const inv = data.investments.find(i => i.id === p.investmentId);
          return inv?.customerId;
        })
        .filter(Boolean)
    );

    return data.customers.filter(customer => {
      const hasActiveInvestment = data.investments.some(inv => inv.customerId === customer.id && inv.status === 'active');
      return hasActiveInvestment && !paidCustomerIds.has(customer.id);
    });
  }, [data.payments, data.investments, data.customers]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div className="px-1">
        <div className="flex items-center gap-2">
           <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Financial Hub</h2>
           <Sparkles className="text-amber-400 animate-pulse" size={20} fill="currentColor" />
        </div>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">
           Analytics • {new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Hero Stat: Total Need to Collect */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <StatCard 
          title="Total Need to Collect" 
          value={`Rs ${totalRemainingToCollect.toLocaleString()}`} 
          subValue="Outstanding Balance from All Customers"
          icon={Clock}
          theme="amber"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Invested" 
          value={`Rs ${totalInvested.toLocaleString()}`} 
          subValue={`${data.investments.filter(i => i.status === 'active').length} Active Accounts`}
          icon={Wallet}
          theme="blue"
        />
        <StatCard 
          title="Projected Profit" 
          value={`Rs ${totalProjectedProfit.toLocaleString()}`} 
          subValue="Expected Net Gain"
          icon={TrendingUp}
          theme="violet"
          percentage={roiPercentage}
        />
        <StatCard 
          title="Total Received" 
          value={`Rs ${totalCollected.toLocaleString()}`} 
          subValue={`${collectionRate.toFixed(1)}% of targets met`}
          icon={Banknote}
          theme="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Income Analysis Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Income Trends</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Past 6 Months Overview</p>
            </div>
            <div className="hidden md:flex bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest items-center border border-emerald-100 shadow-sm">
               <ArrowUpRight size={14} className="mr-1.5" />
               Live Flow
            </div>
          </div>
          
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                  tickFormatter={(value) => `Rs ${value}`}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 8}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-[10px] rounded-xl py-2 px-3 shadow-xl transform transition-all border border-slate-700">
                          <p className="font-black mb-1 opacity-60 uppercase tracking-widest">{payload[0].payload.name}</p>
                          <p className="text-base font-black text-emerald-400 tracking-tight">Rs {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? 'url(#colorUv)' : '#e2e8f0'} 
                      className="transition-all duration-500"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
          <div className="flex flex-col space-y-5 mb-6">
            <div className="px-1">
              <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Monthly Flow <Users size={18} className="text-indigo-500" />
              </h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Collection Tracker</p>
            </div>
            
            <div className="flex p-1 bg-slate-100 rounded-2xl w-full">
              <button 
                onClick={() => setContributorTab('paid')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${contributorTab === 'paid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CheckCircle2 size={14} />
                Paid ({currentMonthContributors.length})
              </button>
              <button 
                onClick={() => setContributorTab('unpaid')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${contributorTab === 'unpaid' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Clock size={14} />
                Pending ({unpaidDistributors.length})
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[400px] lg:max-h-full scrollbar-hide">
            {contributorTab === 'paid' ? (
              currentMonthContributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="bg-slate-50 p-4 rounded-full mb-3 grayscale opacity-30">
                    <User size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No entries recorded</p>
                </div>
              ) : (
                currentMonthContributors.map((contributor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-[1.5rem] bg-emerald-50/20 border border-emerald-100/50 hover:bg-emerald-50/40 transition-all group animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-emerald-100 shadow-sm">
                        {contributor.profileImage ? (
                          <img src={contributor.profileImage} alt={contributor.name} className="h-full w-full object-cover" />
                        ) : (
                          <User size={18} className="text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{contributor.name}</p>
                        <p className="text-[9px] text-emerald-600 font-black mt-1 uppercase tracking-widest opacity-80">Settled</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 tracking-tight">Rs {contributor.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              unpaidDistributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-emerald-600/40">
                  <div className="bg-emerald-50 p-4 rounded-full mb-3 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Fully Cleared</p>
                </div>
              ) : (
                unpaidDistributors.map((customer, idx) => {
                  const activeInv = data.investments.find(i => i.customerId === customer.id && i.status === 'active');
                  return (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-[1.5rem] bg-orange-50/20 border border-orange-100/50 hover:bg-orange-50/40 transition-all group animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-orange-100 shadow-sm">
                          {customer.profileImage ? (
                            <img src={customer.profileImage} alt={customer.name} className="h-full w-full object-cover" />
                          ) : (
                            <User size={18} className="text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{customer.name}</p>
                          <p className="text-[9px] text-orange-500 font-black mt-1 uppercase tracking-widest opacity-80">Awaiting Action</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="px-2 py-1 bg-orange-100/50 text-orange-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-orange-200/50">
                            {activeInv?.title || 'Account Active'}
                         </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
          
          <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {contributorTab === 'paid' ? 'Total Volume' : 'Pending Count'}
            </span>
            <span className={`text-lg font-black tracking-tight ${contributorTab === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
              {contributorTab === 'paid' 
                ? `Rs ${currentMonthContributors.reduce((s, c) => s + c.amount, 0).toLocaleString()}`
                : `${unpaidDistributors.length} Accounts`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
