import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, Heart, Calendar, User, Shield, LogOut, Menu, X, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const { count } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/destinations', label: 'Destinations', icon: MapPin },
    { to: '/packages', label: 'Packages', icon: Sparkles },
    { to: '/planner', label: 'Plan a Trip', icon: Calendar },
    { to: '/dashboard', label: 'My Trips', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/85 border-b border-border-subtle transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105">
            <span className="text-white text-lg font-black font-display tracking-tight">V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-2xl tracking-[0.18em] text-white">
              VOYAGE
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-surface-400 font-semibold -mt-1">
              Luxury Travel
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 bg-white/[0.03] px-3 py-1.5 rounded-full border border-border-subtle">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-xs lg:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-glow-primary'
                    : 'text-surface-300 hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions & Profile */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Favorites Counter Pill */}
          <Link
            to="/dashboard?tab=favorites"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle bg-white/[0.02] text-xs font-semibold text-surface-300 hover:text-white hover:border-primary/50 transition-colors"
            title="Saved Destinations"
          >
            <Heart className={`w-3.5 h-3.5 ${count > 0 ? 'text-coral fill-coral' : ''}`} />
            <span>{count}</span>
          </Link>

          {/* Database Live Status Badge */}
          <div
            className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
              isSupabaseConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
            title="PostgreSQL Database Status"
          >
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Supabase Local'}</span>
          </div>

          {/* User Auth Menu */}
          {profile ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-full bg-white/[0.04] border border-border-subtle hover:border-primary/40 transition-all"
              >
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={profile.full_name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                />
                <span className="text-xs font-semibold text-white max-w-[90px] truncate">
                  {profile.full_name?.split(' ')[0] || 'Traveler'}
                </span>
                {isAdmin && (
                  <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-primary/30">
                    Admin
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown p-2 text-surface-200 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
                    <p className="text-[11px] text-surface-400 truncate">{profile.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-primary" />
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-gold" />
                    Travel Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors my-1 border border-primary/20"
                    >
                      <Shield className="w-4 h-4 text-primary" />
                      Admin Control Panel
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/10 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="primary" size="sm">
                  Join Voyage
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center gap-3">
          <Link
            to="/dashboard?tab=favorites"
            className="flex items-center gap-1.5 p-2 text-surface-300 hover:text-white"
          >
            <Heart className="w-5 h-5 text-coral" />
            <span className="text-xs font-bold">{count}</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-surface-200 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background-secondary border-b border-border-subtle px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-primary text-white' : 'text-surface-300 hover:bg-white/[0.04]'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </NavLink>
            )}
          </nav>

          <div className="pt-4 border-t border-border-subtle flex flex-col gap-2">
            {profile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-surface-400">{profile.email}</p>
                  </div>
                </div>
                <Button variant="danger" size="sm" className="w-full" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
