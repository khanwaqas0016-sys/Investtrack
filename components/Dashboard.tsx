import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppState } from '../types';
import { TrendingUp, Wallet, Banknote, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const StatCard = ({ title, value, subValue, icon: Icon, theme }: any) => {
  const themes = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', sub: 'text-blue-600/80', iconBg: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'text-emerald-600/80', iconBg: 'bg-emerald-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', sub: 'text-violet-600/80', iconBg: 'bg-violet-100' },
  };
  // @ts-ignore
  const t = themes[theme] || themes.blue;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100 transition-transform hover:scale-[1.01] duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-full ${t.iconBg}`}>
          <Icon className={t.text} size={24} strokeWidth={2.5} />
        </div>
        {subValue && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${t.bg} ${t.sub}`}>
            {subValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1 tracking-wide">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const totalInvested = data.investments.reduce((sum, i) => sum + i.amountInvested, 0);
  
  const totalCollected = data.payments
    .filter(p => p.type !== 'lend')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const currentNetPosition = totalCollected - totalInvested;
  
  const totalExpectedReturn = data.investments.reduce((sum, i) => {
    return sum + (i.amountInvested * (1 + i.expectedReturnRate / 100));
  }, 0);

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 mt-1">Financial summary for {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Invested" 
          value={`Rs ${totalInvested.toLocaleString()}`} 
          subValue={`${data.investments.length} Active`}
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
          subValue="Est. Return"
          icon={TrendingUp}
          theme="violet"
        />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Income Analysis</h3>
            <p className="text-sm text-slate-400">Monthly collections over the last 6 months</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold flex items-center">
             <ArrowUpRight size={14} className="mr-1" />
             Income Stream
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc', radius: 8}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800 text-white text-xs rounded-xl py-2 px-3 shadow-xl">
                        <p className="font-bold mb-1">{payload[0].payload.name}</p>
                        <p>Rs {Number(payload[0].value).toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? '#10b981' : '#e2e8f0'} 
                    className="transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;