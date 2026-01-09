import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, Loader2, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { hasRegisteredPasskey, registerLocalPasskey, authenticateLocalPasskey } from '../services/auth';

interface LoginProps {
  onSuccess: () => void;
}

const ALLOWED_EMAIL = 'chiu0907@gmail.com';

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'email' | 'auth'>('email');
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if device has a key, but we still force email entry for identity verification
    setIsRegistered(hasRegisteredPasskey());
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (email.toLowerCase().trim() !== ALLOWED_EMAIL.toLowerCase()) {
      setError('Access Restricted: This email is not authorized.');
      return;
    }

    setStep('auth');
  };

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isRegistered) {
        // Login
        const success = await authenticateLocalPasskey();
        if (success) {
          onSuccess();
        }
      } else {
        // Register
        const success = await registerLocalPasskey(email);
        if (success) {
          setIsRegistered(true);
          onSuccess(); // Auto login after register
        }
      }
    } catch (err: any) {
      // Handle specific WebAuthn errors
      if (err.name === 'NotAllowedError') {
        setError('Request canceled or timed out.');
      } else if (err.name === 'NotSupportedError') {
        setError('Passkeys are not supported on this device/browser.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {step === 'auth' && isRegistered ? (
              <Lock className="h-10 w-10 text-emerald-500" />
            ) : (
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
            )}
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">
          {step === 'email' ? 'Welcome' : (isRegistered ? 'Welcome Back' : 'Secure Setup')}
        </h1>
        
        <p className="mb-8 text-slate-400">
          {step === 'email' 
             ? 'Enter your authorized email to access the dashboard.'
             : (isRegistered 
                ? `Authenticate with your passkey for ${email}` 
                : `Create a passkey to secure access for ${email}`)
          }
        </p>

        {error && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        ) : (
          <>
            <button
              onClick={handleAction}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-4 font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Fingerprint className="transition-transform group-hover:scale-110" />
              )}
              <span>
                {loading 
                  ? (isRegistered ? 'Verifying...' : 'Creating Passkey...') 
                  : (isRegistered ? 'Unlock with Passkey' : 'Create Secure Passkey')
                }
              </span>
            </button>
            <button 
              onClick={() => { setStep('email'); setEmail(''); setError(null); }}
              disabled={loading}
              className="mt-4 text-sm text-slate-500 hover:text-slate-300"
            >
              Use a different email
            </button>
          </>
        )}

        {step === 'auth' && (
          <p className="mt-6 text-xs text-slate-600">
            Powered by WebAuthn. Biometric data stays on device.
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;