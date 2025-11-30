export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  profileImage?: string; // Base64 string for profile picture
}

export interface Investment {
  id: string;
  customerId: string;
  title: string; // e.g., "Real Estate Project A"
  amountInvested: number;
  expectedReturnRate: number; // percentage
  startDate: string;
  endDate: string; // Expected return period end
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Payment {
  id: string;
  investmentId: string;
  amount: number;
  date: string;
  type: 'installment' | 'downpayment' | 'final_settlement' | 'lend';
  notes?: string;
  receiptImage?: string; // Base64 string
}

export interface SecuritySettings {
  enabled: boolean;
  pin: string;
  lockType: 'pin' | 'pattern' | 'biometric';
  autoLockMinutes: number; // 0 for immediately, or 1, 5, 15, 30
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate: string | null;
}

export interface AppState {
  customers: Customer[];
  investments: Investment[];
  payments: Payment[];
  security: SecuritySettings;
  backup: BackupSettings;
}

export type View = 'dashboard' | 'investments' | 'customers' | 'history' | 'ai-insights' | 'settings';

export interface AIAnalysisResult {
  summary: string;
  riskAssessment: string;
  opportunities: string;
  timestamp: number;
}

declare global {
  interface Window {
    showDollarAnimation: (type: 'give' | 'take') => void;
  }
}

// Safe ID Generator to prevent crashes in non-secure contexts
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
