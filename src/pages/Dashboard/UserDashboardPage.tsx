import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  Heart, 
  Calendar, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useDestinations } from '../../hooks/useDestinations';
import { useTrips } from '../../hooks/useTrips';
import { useBookings } from '../../hooks/useBookings';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/common/Button';

export const UserDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const { profile } = useAuth();
  const { favorites } = useFavorites();
  const { destinations } = useDestinations();
  const { trips } = useTrips();
  const { bookings } = useBookings();

  const favoriteDestinations = destinations.filter(d => favorites.includes(d.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* User Header Welcome Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-10 border border-border-strong relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />

        <div className="flex items-center gap-5">
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt="Profile Avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-primary/40 shadow-glow-primary"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary">Traveler Sanctuary</span>
              {profile?.role === 'admin' && (
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/30 uppercase">
                  Admin
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Welcome back, {profile?.full_name || 'Traveler'}
            </h1>
            <p className="text-xs sm:text-sm text-surface-400">
              {profile?.email || 'Logged in to Voyage Mini'} &bull; Private Passport Verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/planner">
            <Button variant="primary" size="md" icon={<Calendar className="w-4 h-4" />}>
              Create New Trip
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="md">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Sparkles },
          { id: 'trips', label: `My Trips (${trips.length})`, icon: Calendar },
          { id: 'favorites', label: `Saved Sanctuaries (${favoriteDestinations.length})`, icon: Heart },
          { id: 'bookings', label: `Reservations (${bookings.length})`, icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              currentTab === tab.id
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-10">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Active Voyages</span>
              <p className="font-display font-black text-3xl text-white">{trips.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Saved Sanctuaries</span>
              <p className="font-display font-black text-3xl text-primary">{favoriteDestinations.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Logged Bookings</span>
              <p className="font-display font-black text-3xl text-gold">{bookings.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Passport Status</span>
              <p className="font-display font-bold text-base text-emerald-400 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4" /> VIP Tier 1
              </p>
            </div>
          </div>

          {/* Upcoming Trips Showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-white">Upcoming Planned Voyages</h3>
              <Link to="/planner" className="text-xs font-semibold text-primary hover:underline">
                Open Studio &rarr;
              </Link>
            </div>

            {trips.length === 0 ? (
              <div className="p-8 rounded-3xl glass-panel text-center text-xs text-surface-400 space-y-2">
                <p>No planned journeys scheduled yet.</p>
                <Link to="/planner">
                  <Button variant="outline" size="sm">Design Your First Trip</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trips.slice(0, 2).map((t) => (
                  <div key={t.id} className="p-6 rounded-3xl glass-panel border border-border-subtle flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                        {t.status.toUpperCase()}
                      </span>
                      <h4 className="font-display font-bold text-lg text-white mt-1">{t.title}</h4>
                      <p className="text-xs text-surface-400 mt-1">
                        {t.start_date ? formatDate(t.start_date) : 'Flexible Departure'} &bull; {t.travelers} Guests
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                      <span className="text-xs text-surface-300">
                        {t.itinerary_items?.length || 0} Excursions Scheduled
                      </span>
                      <Link to="/planner">
                        <Button variant="outline" size="sm">Edit Itinerary</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: My Trips */}
      {currentTab === 'trips' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">All Planned Voyages</h3>
            <Link to="/planner">
              <Button variant="primary" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
                New Voyage
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((t) => (
              <div key={t.id} className="p-6 rounded-3xl glass-panel border border-border-subtle flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                    {t.status.toUpperCase()}
                  </span>
                  <h4 className="font-display font-bold text-lg text-white">{t.title}</h4>
                  <div className="text-xs text-surface-400 space-y-1">
                    <p>Dates: {t.start_date ? formatDate(t.start_date) : 'Flexible'}</p>
                    <p>Travelers: {t.travelers} Guests</p>
                    <p>Budget: {formatCurrency(t.budget)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle">
                  <Link to="/planner" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Open Studio Itinerary
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Saved Favorites */}
      {currentTab === 'favorites' && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl text-white">Your Saved Sanctuaries</h3>

          {favoriteDestinations.length === 0 ? (
            <div className="rounded-3xl glass-panel p-12 text-center text-surface-400 space-y-3">
              <Heart className="w-8 h-8 text-rose-400/50 mx-auto" />
              <p>You haven't bookmarked any sanctuaries yet.</p>
              <Link to="/explore">
                <Button variant="primary" size="sm">Explore Sanctuaries</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteDestinations.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Bookings */}
      {currentTab === 'bookings' && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl text-white">Logged Reservations & Requests</h3>

          {bookings.length === 0 ? (
            <div className="rounded-3xl glass-panel p-12 text-center text-surface-400 space-y-3">
              <p>No active package reservations found.</p>
              <Link to="/packages">
                <Button variant="primary" size="sm">Browse Curated Packages</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 rounded-3xl glass-panel border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                      <h4 className="font-display font-bold text-base text-white">
                        {b.package?.title || 'Signature Journey'}
                      </h4>
                    </div>
                    <p className="text-xs text-surface-400">
                      Departure Date: {b.travel_date ? formatDate(b.travel_date) : 'Scheduled'} &bull; {b.travelers} Guests
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-surface-400 uppercase block">Investment</span>
                      <span className="font-display font-bold text-lg text-white">
                        {formatCurrency(b.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
