import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const RootLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-surface-100 selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Ambient Glowing Background Orbs & Light Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top-Right Amber Gold Orb */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gold/15 via-primary/10 to-transparent blur-[140px] animate-orb-1 opacity-70" />
        
        {/* Center-Left Coral Sunset Orb */}
        <div className="absolute top-[35%] -left-48 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-primary/16 via-coral-dark/10 to-transparent blur-[150px] animate-orb-2 opacity-65" />
        
        {/* Bottom-Right Deep Azure / Indigo Orb */}
        <div className="absolute -bottom-40 right-10 w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-cyan-500/12 via-indigo-500/8 to-transparent blur-[140px] animate-orb-3 opacity-60" />
        
        {/* Subtle Radial Vignette Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,94,58,0.06),transparent_70%)]" />
      </div>

      <Navbar />
      <main className="flex-1 relative z-10">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};
