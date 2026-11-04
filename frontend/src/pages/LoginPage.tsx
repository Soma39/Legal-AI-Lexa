import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@legalai.in');
    setPassword('AdminSecurePassword123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-navy-950 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 dark:from-gold-500 dark:to-gold-600 flex items-center justify-center text-gold-400 dark:text-navy-950 mx-auto shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white">
            Sign in to LegalAI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access personalized legal research, document drafts, and saved inquiries
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-600 text-white dark:text-navy-950 font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white dark:border-navy-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-navy-800">
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="w-full py-2 px-3 rounded-lg bg-gold-50 dark:bg-navy-950 text-gold-700 dark:text-gold-400 border border-gold-300 dark:border-gold-500/30 text-xs font-medium hover:bg-gold-100 dark:hover:bg-navy-800 transition flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fill Initial Admin Credentials</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-navy-800 dark:text-gold-400 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
