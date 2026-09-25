import React, { useState } from 'react';
import { User, Mail, Shield, CheckCircle2, Sparkles, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';

export const UserProfilePage: React.FC = () => {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [interests, setInterests] = useState<string[]>([
    'Temple Architecture',
    'Private Yacht Charters',
    'Michelin Dining',
    'Caldera Sunsets'
  ]);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const availableInterests = [
    'Temple Architecture',
    'Private Yacht Charters',
    'Michelin Dining',
    'Caldera Sunsets',
    'Alpine Trekking',
    'Helicopter Expeditions',
    'Wildlife Safaris',
    'Wellness & Thermal Onsens',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          Passport Credentials
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Traveler Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-surface-400">
          Manage your identity, preferred travel experiences, and concierge preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Summary Card */}
        <div className="rounded-3xl glass-panel p-6 border border-border-subtle text-center space-y-4 h-fit">
          <div className="relative w-28 h-28 mx-auto">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt="Profile"
              className="w-full h-full rounded-3xl object-cover border-2 border-primary shadow-glow-primary"
            />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">{fullName || 'Traveler'}</h3>
            <p className="text-xs text-surface-400">{profile?.email || 'traveler@voyage.luxury'}</p>
          </div>
          <div className="pt-2 border-t border-border-subtle text-left space-y-2 text-xs text-surface-300">
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Security Clearance:</span>
              <span className="text-white font-semibold capitalize">{profile?.role || 'Traveler'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Passport Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Preferences */}
        <div className="md:col-span-2 rounded-3xl glass-panel p-6 sm:p-8 border border-border-subtle space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your travel profile has been saved.</span>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-white border-b border-border-subtle pb-2">
                Personal Credentials
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">
                  Primary Email (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || 'traveler@voyage.luxury'}
                  className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-surface-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Travel Style & Interests */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h3 className="font-display font-bold text-lg text-white">
                Curated Travel Interests
              </h3>
              <p className="text-xs text-surface-400">
                Select your preferred travel elements so our editorial concierge recommends matching journeys.
              </p>

              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-primary text-white border border-primary/50 shadow-glow-primary'
                          : 'bg-white/[0.03] text-surface-400 border border-border-subtle hover:text-white'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <Button type="submit" variant="primary" size="md">
                Save Preferences
              </Button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
