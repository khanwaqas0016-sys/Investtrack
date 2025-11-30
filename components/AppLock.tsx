import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';

interface AppLockProps {
  pin: string;
  onUnlock: () => void;
  isSetup?: boolean;
  onSetupComplete?: (pin: string) => void;
  onCancelSetup?: () => void;
}

const AppLock: React.FC<AppLockProps> = ({ pin, onUnlock, isSetup = false, onSetupComplete, onCancelSetup }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [firstPin, setFirstPin] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);

      // Auto-submit on 4th digit
      if (newInput.length === 4) {
        if (isSetup) {
            handleSetupSubmit(newInput);
        } else {
            handleUnlockSubmit(newInput);
        }
      }
    }
  };

  const handleUnlockSubmit = (enteredPin: string) => {
    if (enteredPin === pin) {
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  };

  const handleSetupSubmit = (enteredPin: string) => {
      if (!confirmStep) {
          setFirstPin(enteredPin);
          setConfirmStep(true);
          setInput('');
      } else {
          if (enteredPin === firstPin) {
              if (onSetupComplete) onSetupComplete(enteredPin);
          } else {
              setError(true);
              setInput('');
              setConfirmStep(false);
              setFirstPin('');
          }
      }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-fade-in">
      <div className="mb-8 flex flex-col items-center">
        <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${error ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
          {error ? <Lock size={40} className="animate-shake" /> : <Lock size={40} />}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
            {isSetup 
                ? (confirmStep ? 'Confirm PIN' : 'Create PIN') 
                : 'App Locked'
            }
        </h2>
        <p className="text-slate-400 text-sm mt-2">
            {isSetup 
                ? (error ? "PINs didn't match. Try again." : "Enter a 4-digit security PIN")
                : (error ? "Incorrect PIN" : "Enter PIN to access InvestTrack")
            }
        </p>
      </div>

      <div className="flex space-x-4 mb-12">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              input.length > i 
                ? (error ? 'bg-red-500' : 'bg-indigo-500 scale-110') 
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 w-72">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center text-xl font-bold transition-all"
          >
            {num}
          </button>
        ))}
        <div className="flex items-center justify-center">
            {isSetup && (
                <button onClick={onCancelSetup} className="text-sm text-slate-400 font-medium hover:text-white">Cancel</button>
            )}
        </div>
        <button
          onClick={() => handlePress('0')}
          className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center text-xl font-bold transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-transparent hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-slate-400 transition-all"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
};

export default AppLock;
