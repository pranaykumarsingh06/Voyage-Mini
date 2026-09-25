import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { profile, isAdmin, loading, simulateAdminMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl glass-panel p-8 sm:p-10 border border-border-strong shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-white">Privileged Access Required</h2>
            <p className="text-xs text-surface-400 leading-relaxed">
              This area is restricted to verified administrators. Your active session (<strong>{profile.email}</strong>) has the <code>traveler</code> role.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-border-subtle text-left space-y-3">
            <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
              Tester / Dev Simulation
            </span>
            <p className="text-xs text-surface-400">
              For local evaluation and demonstration, you can activate administrative clearance:
            </p>
            <Button
              variant="gold"
              size="sm"
              onClick={() => simulateAdminMode(true)}
              className="w-full"
            >
              Simulate Admin Clearance
            </Button>
          </div>

          <div className="pt-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="w-full">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Return to Traveler Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
