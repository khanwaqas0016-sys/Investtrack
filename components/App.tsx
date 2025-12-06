import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvestmentList from './components/InvestmentList';
import CustomerList from './components/CustomerList';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';
import AppLock from './components/AppLock';
import Login from './components/Login';
import { AppState, View, Customer, Investment, Payment, SecuritySettings, BackupSettings } from './types';
import { saveAppData, loadAppData } from './services/storageService';

// Default / Empty State
const INITIAL_DATA: AppState = {
  customers: [],
  investments: [],
  payments: [],
  security: {
    enabled: false,
    pin: '',
    lockType: 'pin',
    autoLockMinutes: 0
  },
  backup: {
    enabled: true,
    frequency: 'weekly',
    lastBackupDate: null
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // App Data State
  const [data, setData] = useState<AppState>(INITIAL_DATA);

  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Initialize Auth and Data from LocalStorage (Simulated Auth)
  useEffect(() => {
    const isAuth = localStorage.getItem('investTrack_isAuthenticated') === 'true';
    const email = localStorage.getItem('investTrack_userEmail');
    
    if (isAuth && email) {
      setCurrentUserEmail(email);
      setIsAuthenticated(true);
      
      // Load data specifically for this user from LocalStorage
      const localData = loadAppData(email);
      if (localData) {
        setData(localData);
      } else {
        // First time user on this device
        setData(INITIAL_DATA);
      }
    }
    setAuthLoading(false);
  }, []);

  // Check initial lock state (if App Lock is enabled)
  useEffect(() => {
    if (isAuthenticated && data.security.enabled) {
      setIsLocked(true);
    }
  }, [isAuthenticated, data.security.enabled]);

  // Auto-Save: Persist Data to LocalStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && currentUserEmail) {
      saveAppData(currentUserEmail, data);
    }
  }, [data, isAuthenticated, currentUserEmail]);

  // Auto-lock Logic (Idle Timer)
  const checkForInactivity = useCallback(() => {
    if (isAuthenticated && data.security.enabled && data.security.autoLockMinutes > 0 && !isLocked) {
      const now = Date.now();
      const idleTime = (now - lastActivity) / 1000 / 60; // in minutes
      if (idleTime >= data.security.autoLockMinutes) {
        setIsLocked(true);
      }
    }
  }, [isAuthenticated, lastActivity, isLocked, data.security]);

  useEffect(() => {
    const interval = setInterval(checkForInactivity, 5000); // Check every 5s
    
    const resetTimer = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [checkForInactivity]);


  // Update Handlers
  const updateData = (partialData: Partial<AppState>) => {
      setData(prev => ({ ...prev, ...partialData }));
  };

  const handleAddCustomer = (customer: Customer) => {
    setData(prev => ({ ...prev, customers: [...prev.customers, customer] }));
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === updatedCust.id ? updatedCust : c)
    }));
  };

  const handleDeleteCustomer = (id: string) => {
    setData(prev => {
      const custInvestments = prev.investments.filter(i => i.customerId === id);
      const custInvestmentIds = new Set(custInvestments.map(i => i.id));
      return {
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        investments: prev.investments.filter(i => i.customerId !== id),
        payments: prev.payments.filter(p => !custInvestmentIds.has(p.investmentId))
      };
    });
  };

  const handleAddInvestment = (investment: Investment) => {
    setData(prev => ({ ...prev, investments: [...prev.investments, investment] }));
  };

  const handleUpdateInvestment = (updatedInv: Investment) => {
    setData(prev => ({
      ...prev,
      investments: prev.investments.map(i => i.id === updatedInv.id ? updatedInv : i)
    }));
  };

  const handleDeleteInvestment = (id: string) => {
    setData(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id),
      payments: prev.payments.filter(p => p.investmentId !== id)
    }));
    return true;
  };

  const handleAddPayment = (payment: Payment) => {
    setData(prev => ({ ...prev, payments: [...prev.payments, payment] }));
  };

  const handleUpdatePayment = (updatedPay: Payment) => {
    setData(prev => ({
      ...prev,
      payments: prev.payments.map(p => p.id === updatedPay.id ? updatedPay : p)
    }));
  };

  const handleDeletePayment = (id: string) => {
    setData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id)
    }));
  };

  const handleSignOut = () => {
    localStorage.removeItem('investTrack_isAuthenticated');
    localStorage.removeItem('investTrack_userEmail');
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    setData(INITIAL_DATA);
  };

  const handleLoginSuccess = () => {
    const email = localStorage.getItem('investTrack_userEmail');
    if (email) {
      setCurrentUserEmail(email);
      setIsAuthenticated(true);
      const localData = loadAppData(email);
      if (localData) setData(localData);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'investments':
        return <InvestmentList 
          data={data} 
          onAddInvestment={handleAddInvestment} 
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
          onAddPayment={handleAddPayment} 
          onUpdatePayment={handleUpdatePayment}
          onDeletePayment={handleDeletePayment}
        />;
      case 'customers':
        return <CustomerList 
          data={data} 
          onAddCustomer={handleAddCustomer} 
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
        />;
      case 'history':
        return <TransactionHistory data={data} onDeletePayment={handleDeletePayment} />;
      case 'settings':
        return <Settings 
            data={data} 
            onUpdateSecurity={(sec) => updateData({ security: sec })}
            onUpdateBackup={(back) => updateData({ backup: back })}
            onSignOut={handleSignOut}
        />;
      default:
        return <Dashboard data={data} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-bold">Loading InvestTrack...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {isLocked && (
        <AppLock 
          pin={data.security.pin} 
          onUnlock={() => {
            setIsLocked(false);
            setLastActivity(Date.now());
          }} 
        />
      )}
      <Layout currentView={currentView} onChangeView={setCurrentView}>
        {renderView()}
      </Layout>
    </>
  );
};

export default App;