import React, { useState, useRef } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, User, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { auth } from "../firebaseConfig";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        
        // Send verification email
        await sendEmailVerification(userCredential.user);
        // Force sign out immediately so they don't access the app
        await signOut(auth);
        
        setVerifyingEmail(email);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          const userEmail = userCredential.user.email || email;
          // Optionally resend if needed, but per requirements we just show screen
          await signOut(auth);
          setVerifyingEmail(userEmail);
          setLoading(false);
          return;
        }
        
        onLoginSuccess();
      }
    } catch (err: any) {
      if (isRegistering && err.code === 'auth/email-already-in-use') {
        setError('user already exists, sign in?');
      } else if (!isRegistering) {
        setError('password or email incorrect');
      } else {
        setError(err.message || 'Authentication error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifyingEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white text-center">
            <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Mail size={40} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Check Your Inbox</h1>
          </div>
          <div className="p-10 text-center">
            <p className="text-slate-600 font-medium leading-relaxed mb-8">
              We have sent you a verification email to <span className="text-indigo-600 font-bold">{verifyingEmail}</span>. 
              Verify it and login.
            </p>
            <button 
              onClick={() => {
                setVerifyingEmail(null);
                setIsRegistering(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Back to Login
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">InvestTrack</h1>
          <p className="opacity-90 flex items-center justify-center gap-2">
            <ShieldCheck size={18} />
            Secure Portfolio Management
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-shake ${
              error === 'user already exists, sign in?' 
              ? 'bg-amber-50 text-amber-700 border-amber-100' 
              : 'bg-red-50 text-red-500 border-red-100'
            }`}>
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div className="flex justify-center mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-20 w-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-300 transition-all"
                  >
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500">
                        <Camera size={20} />
                        <span className="text-[10px] font-black mt-1 uppercase">Photo</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required={isRegistering}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {isRegistering && (
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    type="password" 
                    placeholder="Repeat Password" 
                    required={isRegistering}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (isRegistering ? 'Register & Verify' : 'Secure Sign In')}
              {!loading && <ArrowRight size={18} />}
            </button>
            
            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-sm text-slate-500 font-bold hover:text-indigo-600 transition-colors uppercase tracking-widest"
              >
                {isRegistering ? 'Wait, I have an account' : "New here? Create profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;