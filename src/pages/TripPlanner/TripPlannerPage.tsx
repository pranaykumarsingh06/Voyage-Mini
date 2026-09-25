import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Clock, 
  DollarSign, 
  Users, 
  Sparkles, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { useTrips } from '../../hooks/useTrips';
import { useDestinations } from '../../hooks/useDestinations';
import { ItineraryTimeline } from '../../components/trips/ItineraryTimeline';
import { AddActivityModal } from '../../components/trips/AddActivityModal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/common/Button';

export const TripPlannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedDestId = searchParams.get('destination');
  const { trips, loading, createTrip, addItineraryItem, deleteTrip } = useTrips();
  const { destinations } = useDestinations();

  // Active Trip Index
  const [activeTripId, setActiveTripId] = useState<string>(() => trips[0]?.id || '');
  const [createModalOpen, setCreateModalOpen] = useState(Boolean(preselectedDestId));
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [targetDay, setTargetDay] = useState(1);

  // New Trip Form state
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDestId, setNewTripDestId] = useState(preselectedDestId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(5000);
  const [isCreating, setIsCreating] = useState(false);

  const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle) return;

    setIsCreating(true);
    try {
      const created = await createTrip({
        title: newTripTitle,
        destination_id: newTripDestId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        travelers,
        budget,
        status: 'planning',
      });
      setActiveTripId(created.id);
      setCreateModalOpen(false);
      setNewTripTitle('');
    } catch (err) {
      console.error('[TripPlanner] Error creating trip:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenAddModal = (day: number) => {
    setTargetDay(day);
    setActivityModalOpen(true);
  };

  const handleAddActivity = async (activity: any) => {
    if (!activeTrip) return;
    await addItineraryItem(activeTrip.id, activity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Bespoke Itinerary Studio
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white">
            Trip & Itinerary Planner
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 max-w-xl">
            Architect custom multi-day journeys with real-time day tracking, scheduled excursions, and investment management.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Voyage
        </Button>
      </div>

      {/* Main Workspace */}
      {loading ? (
        <div className="h-96 rounded-3xl bg-white/[0.03] animate-pulse" />
      ) : trips.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">No Planned Voyages Yet</h3>
          <p className="text-xs text-surface-400 leading-relaxed">
            Begin your journey by creating your first bespoke itinerary to any sanctuary in the world.
          </p>
          <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
            Start Planning
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Trip Selector & Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Trips List / Switcher */}
            <div className="rounded-3xl glass-panel p-6 border border-border-subtle space-y-4">
              <span className="text-[11px] uppercase font-bold text-surface-400 tracking-wider block">
                Your Voyages ({trips.length})
              </span>

              <div className="space-y-2">
                {trips.map((t) => {
                  const isActive = (activeTrip?.id === t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTripId(t.id)}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between border ${
                        isActive
                          ? 'bg-white/[0.08] border-primary shadow-glow-primary'
                          : 'bg-white/[0.02] border-border-subtle hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="space-y-1 truncate pr-2">
                        <h4 className="font-display font-bold text-sm text-white truncate">
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-surface-400">
                          <span>{t.destination?.name || 'Global'}</span>
                          <span>&bull;</span>
                          <span>{t.travelers} Guests</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-primary translate-x-1' : 'text-surface-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Trip Overview Card */}
            {activeTrip && (
              <div className="rounded-3xl glass-panel p-6 border border-border-strong space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">Active Voyage</span>
                    <h3 className="font-display font-bold text-xl text-white mt-0.5">{activeTrip.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteTrip(activeTrip.id)}
                    className="p-2 text-surface-500 hover:text-rose-400 transition-colors"
                    title="Delete Voyage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-border-subtle">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border-subtle">
                    <span className="text-surface-500 block text-[10px]">Travelers</span>
                    <span className="font-semibold text-white">{activeTrip.travelers} Guests</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border-subtle">
                    <span className="text-surface-500 block text-[10px]">Budget</span>
                    <span className="font-semibold text-white">{formatCurrency(activeTrip.budget)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border-subtle col-span-2">
                    <span className="text-surface-500 block text-[10px]">Departure & Return</span>
                    <span className="font-semibold text-white">
                      {activeTrip.start_date ? formatDate(activeTrip.start_date) : 'Flexible'} &rarr; {activeTrip.end_date ? formatDate(activeTrip.end_date) : 'Flexible'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenAddModal(1)}
                  className="w-full"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Excursion
                </Button>
              </div>
            )}

          </div>

          {/* Right Column: Daily Itinerary Timeline */}
          <div className="lg:col-span-8 space-y-6">
            {activeTrip && (
              <ItineraryTimeline
                items={activeTrip.itinerary_items || []}
                onOpenAddModal={handleOpenAddModal}
              />
            )}
          </div>

        </div>
      )}

      {/* Create New Trip Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong shadow-2xl">
            <h3 className="font-display font-bold text-2xl text-white mb-5">Create New Voyage</h3>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                  Voyage Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mediterranean Autumn Grand Odyssey"
                  value={newTripTitle}
                  onChange={(e) => setNewTripTitle(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                  Destination Sanctuary
                </label>
                <select
                  value={newTripDestId}
                  onChange={(e) => setNewTripDestId(e.target.value)}
                  className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Select a destination sanctuary...</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                    Travelers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1">
                    Estimated Budget ($)
                  </label>
                  <input
                    type="number"
                    step={100}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" size="md" onClick={() => setCreateModalOpen(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isCreating} className="w-1/2">
                  Create Voyage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={activityModalOpen}
        defaultDay={targetDay}
        onClose={() => setActivityModalOpen(false)}
        onAdd={handleAddActivity}
      />

    </div>
  );
};
