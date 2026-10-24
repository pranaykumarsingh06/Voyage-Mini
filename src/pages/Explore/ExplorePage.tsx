import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Grid, List, Sparkles, X, Globe2 } from 'lucide-react';
import { useDestinations } from '../../hooks/useDestinations';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { BookingModal } from '../../components/packages/BookingModal';
import { Destination, DestinationCategory } from '../../types/database';
import { Button } from '../../components/common/Button';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations, loading, error } = useDestinations();

  // Booking Modal State
  const [selectedBookingDest, setSelectedBookingDest] = useState<Destination | null>(null);

  // Search & Filter state initialized from query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [maxBudget, setMaxBudget] = useState<number>(7000);
  const [sortBy, setSortBy] = useState<'rating' | 'budget-asc' | 'budget-desc' | 'name'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Available unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(destinations.map(d => d.country)));
    return list.sort();
  }, [destinations]);

  // Unified Categories with Alpine & Coastal Friendly Labels
  const categoryFilters = [
    { id: 'all', label: 'All Sanctuaries' },
    { id: 'Mountains', label: 'Alpine' },
    { id: 'Beaches', label: 'Coastal' },
    { id: 'Cultural', label: 'Cultural' },
    { id: 'Adventure', label: 'Adventure' },
    { id: 'Luxury', label: 'Luxury' },
    { id: 'Wildlife', label: 'Wildlife' }
  ];

  // Filtered & sorted destinations
  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((dest) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          dest.name.toLowerCase().includes(query) ||
          dest.country.toLowerCase().includes(query) ||
          dest.description.toLowerCase().includes(query) ||
          dest.category.toLowerCase().includes(query);

        const matchesCategory =
          selectedCategory === 'all' || dest.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesCountry =
          selectedCountry === 'all' || dest.country === selectedCountry;

        const matchesBudget =
          !dest.estimated_budget || dest.estimated_budget <= maxBudget;

        return matchesSearch && matchesCategory && matchesCountry && matchesBudget;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'budget-asc') return (a.estimated_budget || 0) - (b.estimated_budget || 0);
        if (sortBy === 'budget-desc') return (b.estimated_budget || 0) - (a.estimated_budget || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [destinations, searchTerm, selectedCategory, selectedCountry, maxBudget, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCountry('all');
    setMaxBudget(7000);
    setSortBy('rating');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          The Global Portfolio &bull; 12 Destinations
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white">
          Discover Sanctuaries
        </h1>
        <p className="text-xs sm:text-sm text-surface-300 max-w-xl">
          Filter through our private atlas of curated architectural villas, alpine retreats, and coastal havens.
        </p>
      </div>

      {/* Filter Toolbar with Modern Dark Glassmorphism */}
      <div className="rounded-3xl glass-panel p-6 border border-white/15 space-y-6 shadow-2xl">
        
        {/* Top Search & Display Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Real-time Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by city, country, or sanctuary name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input rounded-2xl pl-11 pr-10 py-2.5 text-sm text-white placeholder:text-surface-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode & Sort Dropdowns */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
              <span className="text-surface-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
              >
                <option value="rating" className="bg-background-secondary text-white">Highest Rated</option>
                <option value="budget-asc" className="bg-background-secondary text-white">Budget (Low to High)</option>
                <option value="budget-desc" className="bg-background-secondary text-white">Budget (High to Low)</option>
                <option value="name" className="bg-background-secondary text-white">Name (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-white shadow-glow-primary' : 'text-surface-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white shadow-glow-primary' : 'text-surface-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Category Filter Pills with Active Glow State */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400 mr-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" /> Filter Style:
          </span>
          {categoryFilters.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive ? 'glass-pill-active scale-105' : 'glass-pill'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Country & Budget Slider Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/10 items-center">
          
          {/* Country Selector */}
          <div>
            <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">
              Select Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full glass-input bg-background-secondary rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Countries ({countries.length} Available)</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">
              <span>Max Budget</span>
              <span className="text-gold font-display font-extrabold text-sm">${maxBudget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={8000}
              step={200}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Reset Filters shortcut */}
          <div className="flex sm:justify-end items-end h-full pt-4 sm:pt-0">
            <button
              onClick={handleResetFilters}
              className="text-xs text-surface-400 hover:text-primary underline flex items-center gap-1.5 transition-colors font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-surface-400">
        <span>Showing <strong className="text-white">{filteredDestinations.length}</strong> of {destinations.length} sanctuaries</span>
      </div>

      {/* Destinations Grid / List with Dark Glassmorphism */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-white/[0.04] animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center space-y-4 max-w-lg mx-auto border border-white/15">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-surface-400 mx-auto">
            <Filter className="w-8 h-8 opacity-60 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">No Sanctuaries Found</h3>
          <p className="text-xs text-surface-300 leading-relaxed">
            We could not find any destinations matching your criteria. Try adjusting your search term, country, or budget slider.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredDestinations.map((dest) => (
            <DestinationCard 
              key={dest.id} 
              destination={dest} 
              onQuickBook={(d) => setSelectedBookingDest(d)}
            />
          ))}
        </div>
      )}

      {/* Interactive Booking Modal */}
      <BookingModal
        destination={selectedBookingDest}
        isOpen={Boolean(selectedBookingDest)}
        onClose={() => setSelectedBookingDest(null)}
      />

    </div>
  );
};
