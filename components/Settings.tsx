import React, { useState } from 'react';
import { AppState, SecuritySettings, BackupSettings } from '../types';
import { Lock, Shield, Smartphone, Clock, Cloud, Download, History, ChevronRight, ToggleLeft, ToggleRight, CheckCircle, Save, Database, RefreshCw } from 'lucide-react';
import AppLock from './AppLock';

interface SettingsProps {
  data: AppState;
  onUpdateSecurity: (settings: SecuritySettings) => void;
  onUpdateBackup: (settings: BackupSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ data, onUpdateSecurity, onUpdateBackup }) => {
  const [showPinSetup, setShowPinSetup] = useState(false);

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
  const handleBackupNow = () => {
    // Simulate backup creation
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

  const toggleBackup = () => {
    onUpdateBackup({
      ...data.backup,
      enabled: !data.backup.enabled
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 font-medium text-sm">Security & Data Management</p>
      </div>

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

      {/* Backup Section */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl">
             <Database className="text-emerald-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Backup & Restore</h3>
            <p className="text-xs text-slate-500">Manage your data</p>
          </div>
        </div>

        <div className="p-2">
             <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                    <Cloud size={20} className="text-slate-400" />
                    <div>
                        <span className="font-medium text-slate-700 block">Auto Backup</span>
                        <span className="text-xs text-slate-400">Save data locally</span>
                    </div>
                </div>
                <button onClick={toggleBackup} className="text-emerald-500 transition-transform active:scale-95">
                    {data.backup.enabled 
                        ? <ToggleRight size={48} strokeWidth={1.5} className="fill-emerald-50" /> 
                        : <ToggleLeft size={48} strokeWidth={1.5} className="text-slate-300" />
                    }
                </button>
            </div>

            {data.backup.enabled && (
                <div className="mt-2 pl-4 pr-2 space-y-1 animate-fade-in">
                     {/* Frequency */}
                     <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                            <History size={20} className="text-slate-400" />
                            <span className="font-medium text-slate-700">Frequency</span>
                        </div>
                        <select 
                            value={data.backup.frequency}
                            onChange={(e) => onUpdateBackup({...data.backup, frequency: e.target.value as any})}
                            className="bg-slate-100 text-slate-700 text-sm font-semibold py-2 pl-3 pr-8 rounded-xl outline-none border-r-8 border-transparent capitalize"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="p-4 flex items-center gap-3 text-xs text-slate-500">
                        <CheckCircle size={14} className="text-emerald-500"/>
                        Last Backup: <span className="font-mono text-slate-700 font-bold">{data.backup.lastBackupDate ? new Date(data.backup.lastBackupDate).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            )}

            <div className="p-4">
                <button 
                    onClick={handleBackupNow}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-transform active:scale-[0.98]"
                >
                    <Download size={20} />
                    Backup Now (JSON)
                </button>
            </div>
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