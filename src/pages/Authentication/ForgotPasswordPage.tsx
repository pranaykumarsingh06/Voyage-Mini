import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorMessage } from '../../lib/firebase';
import { Button } from '../../components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl glass-panel p-8 sm:p-10 border border-border-strong shadow-2xl relative overflow-hidden">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="font-display font-bold text-2xl text-white">Reset Password</h2>
          <p className="text-xs text-surface-400">Enter your email and we will dispatch a secure reset link</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-surface-300">
              A secure password reset link has been dispatched to <strong className="text-white">{email}</strong>.
            </p>
            <Link to="/auth/signin">
              <Button variant="outline" size="sm" className="w-full mt-2">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-surface-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@luxury.com"
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
              Dispatch Reset Link
            </Button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/auth/signin" className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
