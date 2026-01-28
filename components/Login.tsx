import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { checkUserEmail } from '../services/api';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState(() => {
    // Retrieve email from cookie on mount
    const cookies = document.cookie.split('; ');
    const emailCookie = cookies.find(c => c.startsWith('pa_email='));
    return emailCookie ? decodeURIComponent(emailCookie.split('=')[1]) : '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await checkUserEmail(email.trim());
      
      if (!data.exists || !data.user || !data.token) {
        throw new Error(data.message || 'User not found or authentication failed');
      }
      
      // Store email in cookie for 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `pa_email=${encodeURIComponent(email.trim())}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      
      // Store auth token and user data
      localStorage.setItem('pa_token', data.token);
      localStorage.setItem('pa_email', email.trim());
      localStorage.setItem('pa_user', JSON.stringify(data.user));
      
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <span className="text-4xl">💰</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8">Wealthy App</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span className="text-xl">🔑</span>
                Continue with Passkey
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-6">
          Secure, private, and encrypted. Your financial data stays yours.
        </p>
      </div>
    </div>
  );
};

export default Login;