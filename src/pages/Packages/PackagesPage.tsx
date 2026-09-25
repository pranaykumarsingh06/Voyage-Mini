import React, { useState } from 'react';
import { Sparkles, Filter, Search } from 'lucide-react';
import { usePackages } from '../../hooks/usePackages';
import { PackageCard } from '../../components/packages/PackageCard';
import { BookingModal } from '../../components/packages/BookingModal';
import { TravelPackage } from '../../types/database';

export const PackagesPage: React.FC = () => {
  const { packages, loading } = usePackages();
  const [selectedBookingPkg, setSelectedBookingPkg] = useState<TravelPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      !searchTerm ||
      pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.destination?.name && pkg.destination.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDuration =
      durationFilter === 'all' ||
      (durationFilter === 'short' && pkg.duration_days <= 5) ||
      (durationFilter === 'medium' && pkg.duration_days > 5 && pkg.duration_days <= 8) ||
      (durationFilter === 'long' && pkg.duration_days > 8);

    return matchesSearch && matchesDuration;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          All-Inclusive Expeditions
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white">
          Curated Travel Packages
        </h1>
        <p className="text-xs sm:text-sm text-surface-400 max-w-xl">
          Signature journeys featuring 5-star private suites, dedicated historians, private yacht charters, and VIP concierge dispatch.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl glass-panel p-4 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-surface-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expeditions or destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder:text-surface-400 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
          <span className="text-surface-400">Duration:</span>
          <select
            value={durationFilter}
            onChange={(e: any) => setDurationFilter(e.target.value)}
            className="bg-background-secondary border border-border-subtle text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Any Length</option>
            <option value="short">1 - 5 Days</option>
            <option value="medium">6 - 8 Days</option>
            <option value="long">9+ Days</option>
          </select>
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center text-surface-400">
          <p>No curated travel packages found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSelectBooking={(p) => setSelectedBookingPkg(p)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        travelPackage={selectedBookingPkg}
        isOpen={Boolean(selectedBookingPkg)}
        onClose={() => setSelectedBookingPkg(null)}
      />

    </div>
  );
};
