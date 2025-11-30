import React from 'react';
import { LayoutDashboard, Users, PieChart, History, Settings as SettingsIcon } from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  currentView: View;
  onChangeView: (view: View) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={22} strokeWidth={2} /> },
    { id: 'investments', label: 'Invest', icon: <PieChart size={22} strokeWidth={2} /> },
    { id: 'customers', label: 'People', icon: <Users size={22} strokeWidth={2} /> },
    { id: 'history', label: 'History', icon: <History size={22} strokeWidth={2} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-20 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100/50 transition-all duration-300">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-2xl shadow-lg shadow-indigo-500/20">
              <PieChart className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">InvestTrack</h1>
          </div>
          
          <button 
            onClick={() => onChangeView('settings')}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${currentView === 'settings' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title="Settings"
          >
             <SettingsIcon size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 scroll-smooth">
        <div className="max-w-5xl mx-auto pb-28">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Floating Dock Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)] pb-5 pt-3 pointer-events-auto">
          <div className="flex justify-around items-center max-w-md mx-auto px-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 group ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`
                    absolute inset-0 rounded-2xl transition-all duration-300 opacity-0
                    ${isActive ? 'bg-indigo-50 opacity-100 scale-100' : 'scale-75'}
                  `} />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`}>
                      {item.icon}
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold mt-0.5 animate-fade-in">
                        {item.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;