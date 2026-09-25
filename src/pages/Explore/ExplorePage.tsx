import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Grid, List, Sparkles, X } from 'lucide-react';
import { useDestinations } from '../../hooks/useDestinations';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { DestinationCategory } from '../../types/database';
import { Button } from '../../components/common/Button';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations, loading, error } = useDestinations();

  // Search & Filter state initialized from query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [maxBudget, setMaxBudget] = useState<number>(6000);
  const [sortBy, setSortBy] = useState<'rating' | 'budget-asc' | 'budget-desc' | 'name'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Available unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(destinations.map(d => d.country)));
    return list.sort();
  }, [destinations]);

  // Categories list
  const categories: (DestinationCategory | 'all')[] = [
    'all',
    'Luxury',
    'Cultural',
    'Beaches',
    'Mountains',
    'Wildlife',
    'Adventure',
  ];

  // Filtered & sorted destinations
  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((dest) => {
        const matchesSearch =
          !searchTerm ||
          dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dest.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dest.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === 'all' || dest.category === selectedCategory;

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
    setMaxBudget(6000);
    setSortBy('rating');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          The Global Portfolio
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white">
          Discover Sanctuaries
        </h1>
        <p className="text-xs sm:text-sm text-surface-400 max-w-xl">
          Filter through our private atlas of curated architectural villas, alpine retreats, and coastal havens.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl glass-panel p-6 border border-border-subtle space-y-6">
        
        {/* Top Search & Category Pills */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-surface-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city, country, or sanctuary name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-surface-400 focus:outline-none focus:border-primary transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View mode & Sort */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-2 rounded-2xl border border-border-subtle text-xs">
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

            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-border-subtle">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'text-surface-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-surface-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-primary to-coral text-white shadow-glow-primary scale-102'
                  : 'bg-white/[0.03] text-surface-300 hover:bg-white/[0.08] hover:text-white border border-border-subtle'
              }`}
            >
              {cat === 'all' ? 'All Experiences' : cat}
            </button>
          ))}
        </div>

        {/* Detailed Controls: Country & Budget Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-border-subtle items-center">
          
          {/* Country Selector */}
          <div>
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
              <span>Max Budget</span>
              <span className="text-white font-bold">${maxBudget.toLocaleString()}</span>
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

          {/* Reset button */}
          <div className="flex sm:justify-end items-end h-full pt-4 sm:pt-0">
            <button
              onClick={handleResetFilters}
              className="text-xs text-surface-400 hover:text-primary underline flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>

        </div>

      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-surface-400">
        <span>Showing {filteredDestinations.length} sanctuaries</span>
      </div>

      {/* Destinations Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-border-subtle flex items-center justify-center text-surface-400 mx-auto">
            <Filter className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">No Sanctuaries Found</h3>
          <p className="text-xs text-surface-400 leading-relaxed">
            We could not find any destinations matching your criteria. Try adjusting your search term, country, or budget slider.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredDestinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      )}

    </div>
  );
};
