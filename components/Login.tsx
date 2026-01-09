import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { hasRegisteredPasskey, registerLocalPasskey, authenticateLocalPasskey } from '../services/auth';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRegistered(hasRegisteredPasskey());
  }, []);

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
        const success = await registerLocalPasskey();
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
            {isRegistered ? (
              <Lock className="h-10 w-10 text-emerald-500" />
            ) : (
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
            )}
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">
          {isRegistered ? 'Welcome Back' : 'Secure Your Wealth'}
        </h1>
        
        <p className="mb-8 text-slate-400">
          {isRegistered 
            ? 'Authenticate with your passkey to access your dashboard.' 
            : 'Set up a passkey (FaceID, TouchID, or Hello) to secure your data on this device.'}
        </p>

        {error && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

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

        <p className="mt-6 text-xs text-slate-600">
          Powered by WebAuthn. Your biometric data never leaves this device.
        </p>
      </div>
    </div>
  );
};

export default Login;