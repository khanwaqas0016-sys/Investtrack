import React, { useState } from 'react';
import { AppState, SecuritySettings, BackupSettings } from '../types';
import { Lock, Shield, Smartphone, Clock, Cloud, Download, History, ChevronRight, ToggleLeft, ToggleRight, CheckCircle, Save, Database, RefreshCw, Mail, Phone, User, Upload, LogOut } from 'lucide-react';
import AppLock from './AppLock';

interface SettingsProps {
  data: AppState;
  onUpdateSecurity: (settings: SecuritySettings) => void;
  onUpdateBackup: (settings: BackupSettings) => void;
  onSignOut: () => void;
}

const Settings: React.FC<SettingsProps> = ({ data, onUpdateSecurity, onUpdateBackup, onSignOut }) => {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Security Handlers
  const toggleAppLock = () => {
    if (!data.security.enabled) {
      // Enabling: Requires setting a PIN
      setShowPinSetup(true);
    } else {
      // Disabling
      onUpdateSecurity({ ...data.security, enabled: false });
    }
  };

  const handlePinSetupComplete = (newPin: string) => {
    onUpdateSecurity({
      ...data.security,
      enabled: true,
      pin: newPin
    });
    setShowPinSetup(false);
  };

  // Backup Handlers
  const handleExportBackup = () => {
    // Export Local Storage data
    const backupData = JSON.stringify(data, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `InvestTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onUpdateBackup({
      ...data.backup,
      lastBackupDate: new Date().toISOString()
    });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const parsedData = JSON.parse(json);
          
          // Basic validation to check if it has the right shape
          if (parsedData.customers && parsedData.investments) {
            localStorage.setItem('investTrackData', JSON.stringify(parsedData));
            setImportStatus('Backup restored successfully! Reloading...');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setImportStatus('Error: Invalid backup file format.');
          }
        } catch (err) {
          setImportStatus('Error: Could not parse file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
          <p className="text-slate-500 font-medium text-sm">Security, Data & Support</p>
        </div>
        <button 
          onClick={onSignOut}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>

      {/* Support Section */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-xl">
             <User className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Contact Support</h3>
            <p className="text-xs text-slate-500">Developer Information</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="bg-white p-3 rounded-full shadow-sm text-slate-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Developed By</p>
              <p className="font-bold text-slate-800">Waqas Ahmad</p>
            </div>
          </div>
          
          <a href="mailto:khanwaqas0016@gmail.com" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
            <div className="bg-white p-3 rounded-full shadow-sm text-slate-700 group-hover:text-indigo-600">
              <Mail size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
              <p className="font-bold text-slate-800 truncate">khanwaqas0016@gmail.com</p>
            </div>
          </a>

          <a href="tel:+971582685224" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
            <div className="bg-white p-3 rounded-full shadow-sm text-slate-700 group-hover:text-green-600">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Mobile / WhatsApp</p>
              <p className="font-bold text-slate-800">+971 58 268 5224</p>
            </div>
          </a>
        </div>
      </section>

      {/* Backup Section */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl">
             <Database className="text-emerald-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Backup & Restore</h3>
            <p className="text-xs text-slate-500">Manage your data locally</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
             <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 text-xs text-slate-500">
                <CheckCircle size={14} className="text-emerald-500"/>
                Last Export: <span className="font-mono text-slate-700 font-bold">{data.backup.lastBackupDate ? new Date(data.backup.lastBackupDate).toLocaleString() : 'Never'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={handleExportBackup}
                    className="py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-transform active:scale-[0.98]"
                >
                    <Download size={20} />
                    Export JSON
                </button>
                
                <label className="py-4 bg-white border-2 border-dashed border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload size={20} />
                    Import JSON
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
            </div>
            
            {importStatus && (
               <p className={`text-center text-sm font-medium ${importStatus.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                 {importStatus}
               </p>
            )}
        </div>
      </section>

      {/* App Lock Section */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-xl">
             <Shield className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">App Lock</h3>
            <p className="text-xs text-slate-500">Protect your financial data</p>
          </div>
        </div>

        <div className="p-2">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                    <Lock size={20} className="text-slate-400" />
                    <span className="font-medium text-slate-700">Enable App Lock</span>
                </div>
                <button onClick={toggleAppLock} className="text-indigo-600 transition-transform active:scale-95">
                    {data.security.enabled 
                        ? <ToggleRight size={48} strokeWidth={1.5} className="fill-indigo-50" /> 
                        : <ToggleLeft size={48} strokeWidth={1.5} className="text-slate-300" />
                    }
                </button>
            </div>

            {/* Lock Settings - Only visible if enabled */}
            {data.security.enabled && (
                <div className="mt-2 pl-4 pr-2 space-y-1 animate-fade-in">
                    {/* Unlock Method */}
                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                            <Smartphone size={20} className="text-slate-400" />
                            <div>
                                <p className="font-medium text-slate-700">Unlock Method</p>
                                <p className="text-xs text-slate-400">PIN (Default), Biometric, Pattern</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                             {['pin', 'pattern', 'biometric'].map((type) => (
                                 <button
                                    key={type}
                                    onClick={() => onUpdateSecurity({...data.security, lockType: type as any})}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                                        data.security.lockType === type 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                 >
                                     {type}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* Auto Lock Timer */}
                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                            <Clock size={20} className="text-slate-400" />
                            <div>
                                <p className="font-medium text-slate-700">Auto-lock Timer</p>
                                <p className="text-xs text-slate-400">Lock after inactivity</p>
                            </div>
                        </div>
                        <select 
                            value={data.security.autoLockMinutes}
                            onChange={(e) => onUpdateSecurity({...data.security, autoLockMinutes: Number(e.target.value)})}
                            className="bg-slate-100 text-slate-700 text-sm font-semibold py-2 pl-3 pr-8 rounded-xl outline-none border-r-8 border-transparent"
                        >
                            <option value={0}>Immediately</option>
                            <option value={1}>1 Minute</option>
                            <option value={5}>5 Minutes</option>
                            <option value={15}>15 Minutes</option>
                            <option value={30}>30 Minutes</option>
                        </select>
                    </div>

                     {/* Change PIN Button */}
                     <button 
                        onClick={() => setShowPinSetup(true)}
                        className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 flex items-center justify-between group"
                     >
                        <span className="font-medium text-slate-700 pl-8">Change PIN</span>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                     </button>
                </div>
            )}
        </div>
      </section>

      {/* Pin Setup Modal Overlay */}
      {showPinSetup && (
        <AppLock 
            pin="" 
            onUnlock={() => {}} 
            isSetup={true} 
            onSetupComplete={handlePinSetupComplete}
            onCancelSetup={() => setShowPinSetup(false)}
        />
      )}
    </div>
  );
};

export default Settings;