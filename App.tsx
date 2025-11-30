import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvestmentList from './components/InvestmentList';
import CustomerList from './components/CustomerList';
import TransactionHistory from './components/TransactionHistory';
import AIInsights from './components/AIInsights';
import Settings from './components/Settings';
import AppLock from './components/AppLock';
import { AppState, View, Customer, Investment, Payment, SecuritySettings, BackupSettings } from './types';

// Mock Initial Data
const INITIAL_DATA: AppState = {
  customers: [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', joinedDate: '2023-01-15' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', joinedDate: '2023-03-22' },
  ],
  investments: [
    { id: '101', customerId: '1', title: 'Downtown Apt 402', amountInvested: 150000, expectedReturnRate: 12, startDate: '2023-02-01', endDate: '2024-02-01', status: 'active' },
    { id: '102', customerId: '2', title: 'Tech Start Seed Fund', amountInvested: 50000, expectedReturnRate: 25, startDate: '2023-06-15', endDate: '2025-06-15', status: 'active' },
  ],
  payments: [
    { id: 'p1', investmentId: '101', amount: 15000, date: '2023-03-01', type: 'downpayment' },
    { id: 'p2', investmentId: '101', amount: 5000, date: '2023-04-01', type: 'installment' },
    { id: 'p3', investmentId: '102', amount: 50000, date: '2023-06-15', type: 'downpayment' },
  ],
  security: {
    enabled: false,
    pin: '',
    lockType: 'pin',
    autoLockMinutes: 0
  },
  backup: {
    enabled: false,
    frequency: 'weekly',
    lastBackupDate: null
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem('investTrackData');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure new fields exist if loading old data
      return {
        ...INITIAL_DATA,
        ...parsed,
        security: parsed.security || INITIAL_DATA.security,
        backup: parsed.backup || INITIAL_DATA.backup
      };
    }
    return INITIAL_DATA;
  });

  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Check initial lock state
  useEffect(() => {
    if (data.security.enabled) {
      setIsLocked(true);
    }
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('investTrackData', JSON.stringify(data));
  }, [data]);

  // Auto-lock Logic
  const checkForInactivity = useCallback(() => {
    if (data.security.enabled && data.security.autoLockMinutes > 0 && !isLocked) {
      const now = Date.now();
      const idleTime = (now - lastActivity) / 1000 / 60; // in minutes
      if (idleTime >= data.security.autoLockMinutes) {
        setIsLocked(true);
      }
    }
  }, [lastActivity, isLocked, data.security]);

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
      case 'ai-insights':
        return <AIInsights data={data} />;
      case 'settings':
        return <Settings 
            data={data} 
            onUpdateSecurity={(sec) => updateData({ security: sec })}
            onUpdateBackup={(back) => updateData({ backup: back })}
        />;
      default:
        return <Dashboard data={data} />;
    }
  };

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
