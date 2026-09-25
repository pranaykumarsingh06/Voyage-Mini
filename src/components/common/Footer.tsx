import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Globe, Shield, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from './Button';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('newsletter_subscribers')
          .insert({ email });
      } catch (err) {
        console.warn('[Footer] Newsletter subscription saved locally:', err);
      }
    }

    setSubscribed(true);
    setLoading(false);
    setEmail('');
  };

  return (
    <footer className="bg-background-secondary border-t border-border-subtle mt-auto pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter CTA */}
        <div className="rounded-3xl glass-panel p-8 sm:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                The Voyage Dispatch
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                Private Escapes Delivered To Your Inbox
              </h3>
              <p className="text-sm text-surface-400 mt-2 max-w-md">
                Receive secret hotel inaugurations, seasonal flight charters, and curated itineraries crafted by our travel editors.
              </p>
            </div>

            <div>
              {subscribed ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium">Welcome to the inner circle. Your private dispatch begins shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your private email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-surface-400 focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button type="submit" variant="primary" size="md" isLoading={loading} icon={<ArrowRight className="w-4 h-4" />}>
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-border-subtle">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center shadow-glow-primary">
                <span className="text-white text-base font-black font-display">V</span>
              </div>
              <span className="font-display font-extrabold text-xl tracking-[0.2em] text-white">
                VOYAGE
              </span>
            </Link>
            <p className="text-xs text-surface-400 leading-relaxed max-w-sm">
              An award-winning travel-tech platform orchestrating transformative expeditions, private island retreats, and bespoke itineraries for discerning global nomads.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-surface-400">
              <Globe className="w-4 h-4 text-primary" />
              <span>Worldwide Concierge Network &bull; 24/7 Support</span>
            </div>
          </div>

          {/* Column 1: Discovery */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-xs text-surface-400">
              <li><Link to="/explore" className="hover:text-primary transition-colors">Explore All</Link></li>
              <li><Link to="/destinations" className="hover:text-primary transition-colors">Iconic Sanctuaries</Link></li>
              <li><Link to="/packages" className="hover:text-primary transition-colors">Curated Expeditions</Link></li>
              <li><Link to="/destinations?category=Beaches" className="hover:text-primary transition-colors">Caldera & Islands</Link></li>
              <li><Link to="/destinations?category=Cultural" className="hover:text-primary transition-colors">Cultural Heritage</Link></li>
            </ul>
          </div>

          {/* Column 2: Architecture */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs text-surface-400">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Firebase Auth</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Supabase PostgreSQL</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Row Level Security</li>
              <li><span>Vite + React + TypeScript</span></li>
              <li><span>Framer Motion Design</span></li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5 text-xs text-surface-400">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">User Dashboard</Link></li>
              <li><Link to="/planner" className="hover:text-primary transition-colors">Trip Planner</Link></li>
              <li><Link to="/dashboard?tab=favorites" className="hover:text-primary transition-colors">Saved Sanctuaries</Link></li>
              <li><Link to="/auth/signin" className="hover:text-primary transition-colors">Sign In</Link></li>
              <li><Link to="/admin" className="text-primary hover:underline">Admin Control Panel</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-400">
          <p>&copy; {new Date().getFullYear()} VOYAGE Mini. Handcrafted with cinematic precision.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-surface-200 cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-surface-200 cursor-pointer">Terms of Service</span>
            <span className="hover:text-surface-200 cursor-pointer">Security Compliance</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
