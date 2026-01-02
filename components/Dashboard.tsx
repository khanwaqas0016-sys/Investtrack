
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppState } from '../types';
import { TrendingUp, Wallet, Banknote, ArrowUpRight, Sparkles, Users, User, Clock, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const StatCard = ({ title, value, subValue, icon: Icon, theme }: any) => {
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
  };
  // @ts-ignore
  const t = themes[theme] || themes.blue;

  return (
    <div className={`
      bg-white p-6 rounded-[2rem] 
      shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]
      border border-slate-100 ${t.hoverBorder}
      transition-all duration-300 hover:-translate-y-1 group cursor-default
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl ${t.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={t.text} size={24} strokeWidth={2.5} />
        </div>
        {subValue && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${t.bg} ${t.sub} flex items-center gap-1`}>
            {subValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1 tracking-wide uppercase text-[10px]">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">{value}</h3>
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
    
  const currentNetPosition = totalCollected - totalInvested;
  
  const totalExpectedReturn = data.investments.reduce((sum, i) => {
    const expected = i.manualReturnAmount
      ? i.manualReturnAmount
      : i.amountInvested * (1 + i.expectedReturnRate / 100);
    return sum + expected;
  }, 0);

  // User updated requirement: Profit = total Expected Return - total Investment Amount
  const totalProjectedProfit = totalExpectedReturn - totalInvested;

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

  // Logic for "Monthly Contributors" (Customers who paid this month)
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

  // Logic for "Unpaid Distributors" (Customers with active investments who haven't paid this month)
  const unpaidDistributors = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Get IDs of customers who HAVE paid this month
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

    // 2. Filter customers who have at least one active investment AND are NOT in the paid list
    return data.customers.filter(customer => {
      const hasActiveInvestment = data.investments.some(inv => inv.customerId === customer.id && inv.status === 'active');
      return hasActiveInvestment && !paidCustomerIds.has(customer.id);
    });
  }, [data.payments, data.investments, data.customers]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Overview <Sparkles className="text-amber-400" size={24} fill="currentColor" />
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Financial summary for {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Invested" 
          value={`Rs ${totalInvested.toLocaleString()}`} 
          subValue={`${data.investments.filter(i => i.status === 'active').length} Active`}
          icon={Wallet}
          theme="blue"
        />
        <StatCard 
          title="Total Received" 
          value={`Rs ${totalCollected.toLocaleString()}`} 
          subValue={currentNetPosition >= 0 ? `+${((currentNetPosition/totalInvested || 0) * 100).toFixed(1)}%` : undefined}
          icon={Banknote}
          theme="emerald"
        />
        <StatCard 
          title="Projected Profit" 
          value={`Rs ${totalProjectedProfit.toLocaleString()}`} 
          subValue="Est. Gain"
          icon={TrendingUp}
          theme="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income Analysis Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] transition-shadow duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Income Analysis</h3>
              <p className="text-sm text-slate-400 font-medium">Monthly collections over the last 6 months</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold flex items-center border border-emerald-100 shadow-sm">
               <ArrowUpRight size={14} className="mr-1" />
               Income Stream
            </div>
          </div>
          
          <div className="h-72 w-full">
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
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  tickFormatter={(value) => `Rs ${value}`}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 8}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl transform transition-all">
                          <p className="font-bold mb-1 opacity-70">{payload[0].payload.name}</p>
                          <p className="text-base font-bold text-emerald-400">Rs {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? 'url(#colorUv)' : '#e2e8f0'} 
                      className="transition-all duration-500 hover:opacity-100"
                      style={{
                          filter: index === chartData.length - 1 ? 'drop-shadow(0px 4px 10px rgba(16, 185, 129, 0.2))' : 'none'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributors & Unpaid Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col min-h-[450px]">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Distribution <Users size={18} className="text-indigo-500" />
                </h3>
                <p className="text-sm text-slate-400 font-medium">Monthly status</p>
              </div>
            </div>
            
            {/* Tab Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-full">
              <button 
                onClick={() => setContributorTab('paid')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${contributorTab === 'paid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CheckCircle2 size={14} />
                Paid ({currentMonthContributors.length})
              </button>
              <button 
                onClick={() => setContributorTab('unpaid')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${contributorTab === 'unpaid' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Clock size={14} />
                Unpaid ({unpaidDistributors.length})
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[400px] lg:max-h-full scrollbar-hide">
            {contributorTab === 'paid' ? (
              currentMonthContributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <div className="bg-slate-50 p-4 rounded-full mb-3">
                    <User size={32} className="opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">No payments yet</p>
                </div>
              ) : (
                currentMonthContributors.map((contributor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100 transition-all hover:bg-emerald-50/50 group animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-emerald-200">
                        {contributor.profileImage ? (
                          <img src={contributor.profileImage} alt={contributor.name} className="h-full w-full object-cover" />
                        ) : (
                          <User size={18} className="text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 leading-none">{contributor.name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tighter">Contributor</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-600">Rs {contributor.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              unpaidDistributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-emerald-600/60">
                  <div className="bg-emerald-50 p-4 rounded-full mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">Everyone Paid!</p>
                </div>
              ) : (
                unpaidDistributors.map((customer, idx) => {
                  const activeInv = data.investments.find(i => i.customerId === customer.id && i.status === 'active');
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/30 border border-orange-100 transition-all hover:bg-orange-50/50 group animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-orange-200">
                          {customer.profileImage ? (
                            <img src={customer.profileImage} alt={customer.name} className="h-full w-full object-cover" />
                          ) : (
                            <User size={18} className="text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">{customer.name}</p>
                          <p className="text-[10px] text-orange-500 font-bold mt-1 uppercase tracking-tighter">Pending payment</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {activeInv?.title || 'Account Active'}
                         </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">
              {contributorTab === 'paid' ? 'Collected this month' : 'Pending accounts'}
            </span>
            <span className={`text-base font-black ${contributorTab === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
              {contributorTab === 'paid' 
                ? `Rs ${currentMonthContributors.reduce((s, c) => s + c.amount, 0).toLocaleString()}`
                : `${unpaidDistributors.length} Waiting`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
