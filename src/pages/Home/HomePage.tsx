import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Compass, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Award, 
  ChevronDown, 
  SlidersHorizontal,
  X,
  Globe2
} from 'lucide-react';
import { useDestinations } from '../../hooks/useDestinations';
import { usePackages } from '../../hooks/usePackages';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { PackageCard } from '../../components/packages/PackageCard';
import { BookingModal } from '../../components/packages/BookingModal';
import { TravelPackage, Destination, DestinationCategory } from '../../types/database';
import { Button } from '../../components/common/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { destinations, loading: destLoading } = useDestinations();
  const { packages, loading: pkgLoading } = usePackages();

  // Booking Modal States
  const [selectedBookingPkg, setSelectedBookingPkg] = useState<TravelPackage | null>(null);
  const [selectedDestinationForBooking, setSelectedDestinationForBooking] = useState<Destination | null>(null);

  // Hero Search Form state
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCategory, setHeroCategory] = useState<string>('all');

  // Real-time Interactive Showcase Filter State
  const [realtimeSearch, setRealtimeSearch] = useState('');
  const [activeCategoryPill, setActiveCategoryPill] = useState<string>('all');

  // Hero search submission: scrolls directly to showcase and activates filter
  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch) setRealtimeSearch(heroSearch);
    if (heroCategory !== 'all') setActiveCategoryPill(heroCategory);
    
    const showcaseElem = document.getElementById('destinations-showcase');
    if (showcaseElem) {
      showcaseElem.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/explore?q=${encodeURIComponent(heroSearch)}&category=${encodeURIComponent(heroCategory)}`);
    }
  };

  // Filter Pills Definition
  const filterPills = [
    { id: 'all', label: 'All Sanctuaries' },
    { id: 'alpine', label: 'Alpine', category: 'Mountains' },
    { id: 'coastal', label: 'Coastal', category: 'Beaches' },
    { id: 'cultural', label: 'Cultural', category: 'Cultural' },
    { id: 'adventure', label: 'Adventure', category: 'Adventure' },
    { id: 'luxury', label: 'Luxury', category: 'Luxury' },
    { id: 'wildlife', label: 'Wildlife', category: 'Wildlife' }
  ];

  // Client-side real-time filter computation
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      // 1. Realtime search term filter (matches name, country, description)
      const query = realtimeSearch.trim().toLowerCase();
      const matchesSearch = !query || 
        dest.name.toLowerCase().includes(query) ||
        dest.country.toLowerCase().includes(query) ||
        dest.description.toLowerCase().includes(query) ||
        dest.category.toLowerCase().includes(query);

      // 2. Active category pill filter
      let matchesPill = true;
      if (activeCategoryPill !== 'all') {
        const activePillObj = filterPills.find(p => p.id === activeCategoryPill);
        if (activePillObj && activePillObj.category) {
          matchesPill = dest.category === activePillObj.category;
        } else {
          matchesPill = dest.category.toLowerCase() === activeCategoryPill.toLowerCase();
        }
      }

      return matchesSearch && matchesPill;
    });
  }, [destinations, realtimeSearch, activeCategoryPill]);

  const categories: { label: string; value: DestinationCategory; image: string }[] = [
    {
      label: 'Luxury Escapes',
      value: 'Luxury',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Cultural Sanctuaries',
      value: 'Cultural',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Caldera & Beaches',
      value: 'Beaches',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Alpine & Peaks',
      value: 'Mountains',
      image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Wildlife Expeditions',
      value: 'Wildlife',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Untamed Adventure',
      value: 'Adventure',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const trendingPackages = packages.slice(0, 3);

  return (
    <div className="space-y-28 pb-20">
      
      {/* 1. Cinematic Hero Section with Ambient Glassmorphism */}
      <section className="relative min-h-[92vh] flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Cinematic Backdrop Image with Parallax Aesthetic */}
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85"
            alt="Cinematic Alpine Sanctuary"
            className="w-full h-full object-cover scale-105 opacity-80"
          />
          {/* Multi-layered cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,9,14,0.7)_100%)]" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 z-10 pt-10">
          
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/20 text-primary text-xs font-bold uppercase tracking-widest shadow-glow-primary">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Curated Global Sanctuaries &bull; 2026 Collection
          </div>

          {/* Oversized Modern Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[1.05]">
            THE WORLD IS <br />
            <span className="text-gradient">YOURS TO EXPLORE.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-surface-200 max-w-2xl mx-auto font-normal leading-relaxed">
            Unrivaled private expeditions, bespoke multi-day itineraries, and secluded architectural sanctuaries hand-selected for discerning travelers.
          </p>

          {/* Hero Quick Search Console */}
          <form
            onSubmit={handleHeroSearchSubmit}
            className="rounded-3xl glass-panel p-2.5 sm:p-3 border border-white/20 shadow-2xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2 text-left"
          >
            <div className="sm:col-span-6 flex items-center gap-3 px-4 py-2.5 bg-white/[0.04] rounded-2xl border border-white/10">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Where would you like to escape?"
                className="w-full bg-transparent text-sm text-white placeholder:text-surface-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex items-center px-3 py-2.5 bg-white/[0.04] rounded-2xl border border-white/10">
              <select
                value={heroCategory}
                onChange={(e) => setHeroCategory(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-surface-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-background-secondary text-white">All Styles</option>
                <option value="Mountains" className="bg-background-secondary text-white">Alpine Peaks</option>
                <option value="Beaches" className="bg-background-secondary text-white">Coastal Bays</option>
                <option value="Cultural" className="bg-background-secondary text-white">Cultural Heritage</option>
                <option value="Adventure" className="bg-background-secondary text-white">Untamed Adventure</option>
                <option value="Luxury" className="bg-background-secondary text-white">Pure Luxury</option>
                <option value="Wildlife" className="bg-background-secondary text-white">Wildlife Safari</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" size="md" className="w-full h-full py-3 justify-center shadow-glow-primary" icon={<Search className="w-4 h-4" />}>
                Discover
              </Button>
            </div>
          </form>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="#destinations-showcase">
              <Button variant="outline" size="md" icon={<Compass className="w-4 h-4" />}>
                View 12 Global Sanctuaries
              </Button>
            </a>
            <Link to="/planner">
              <Button variant="gold" size="md" icon={<Calendar className="w-4 h-4" />}>
                Bespoke Itinerary Studio
              </Button>
            </Link>
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-surface-400 text-xs font-semibold tracking-widest uppercase">
          <span>Scroll</span>
          <ChevronDown className="w-4 h-4 text-primary animate-bounce" />
        </div>
      </section>

      {/* 2. Expanded Destinations Showcase (Dark Glassmorphism Grid with Real-time Search & Filter Pills) */}
      <section id="destinations-showcase" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1.5">
              <Award className="w-3.5 h-3.5 text-gold" />
              World-Class Escapes &bull; 12 Global Sanctuaries
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white">
              Curated Destinations Atlas
            </h2>
            <p className="text-xs sm:text-sm text-surface-300 mt-1 max-w-xl">
              Experience the world's most breathtaking landscapes, ancient capitals, and private overwater sanctuaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 font-semibold bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-full">
              Showing <strong className="text-white">{filteredDestinations.length}</strong> of {destinations.length} Sanctuaries
            </span>
          </div>
        </div>

        {/* Real-time Search & Filter Pill Toolbar */}
        <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/15 shadow-xl space-y-5">
          
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Real-time search bar */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={realtimeSearch}
                onChange={(e) => setRealtimeSearch(e.target.value)}
                placeholder="Real-time filter: type Kyoto, Swiss Alps, Bali, Canada..."
                className="w-full glass-input rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-surface-400 font-medium"
              />
              {realtimeSearch && (
                <button
                  onClick={() => setRealtimeSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reset Filters shortcut */}
            {(realtimeSearch || activeCategoryPill !== 'all') && (
              <button
                onClick={() => {
                  setRealtimeSearch('');
                  setActiveCategoryPill('all');
                }}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 self-end lg:self-center"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          {/* Category Filter Pills with Active Glow State */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold" /> Filter Style:
            </span>
            {filterPills.map((pill) => {
              const isActive = activeCategoryPill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveCategoryPill(pill.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive ? 'glass-pill-active scale-105' : 'glass-pill'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Destination Cards Glass Grid */}
        {destLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/[0.04] animate-pulse border border-white/10" />
            ))}
          </div>
        ) : filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDestinations.map((dest) => (
              <DestinationCard 
                key={dest.id} 
                destination={dest} 
                onQuickBook={(d) => setSelectedDestinationForBooking(d)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl glass-panel p-12 text-center space-y-4 border border-white/15">
            <Globe2 className="w-12 h-12 text-surface-500 mx-auto" />
            <h3 className="font-display font-bold text-xl text-white">No Sanctuaries Matched</h3>
            <p className="text-xs text-surface-400 max-w-sm mx-auto">
              We couldn't find any destinations matching "{realtimeSearch}". Try clearing your search keyword or switching category pills.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRealtimeSearch('');
                setActiveCategoryPill('all');
              }}
            >
              Reset All Filters
            </Button>
          </div>
        )}
      </section>

      {/* 3. Explore By Experience Collection Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary mb-1.5 block">
            Signature Categorization
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Explore By Experience
          </h2>
          <p className="text-xs sm:text-sm text-surface-400 mt-2 max-w-lg">
            Whether you crave coastal yachting retreats, ancestral temple walks, or high-altitude alpine silence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/explore?category=${cat.value}`}
              className="group relative rounded-3xl overflow-hidden h-64 border border-white/15 glass-panel-hover shadow-xl"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                    Curated Collection
                  </span>
                  <h3 className="font-display font-bold text-xl text-white group-hover:text-primary transition-colors">
                    {cat.label}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-primary group-hover:text-white transition-all shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Trending Expeditions & Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              All-Inclusive Luxury
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Trending Expeditions
            </h2>
          </div>
          <Link to="/packages" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors">
            <span>View All Curated Packages</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pkgLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/[0.04] animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelectBooking={(p) => setSelectedBookingPkg(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. How Voyage Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel p-8 sm:p-14 border border-white/15 relative overflow-hidden shadow-2xl">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
              The Architecture of Travel
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              How Voyage Works
            </h2>
            <p className="text-xs sm:text-sm text-surface-300">
              Three seamless steps from inspiration to private sanctuary arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0 shadow-glow-primary">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-white">Curated Discovery</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Filter by aesthetic, continent, and budget to uncover verified hotels, hidden calderas, and private ryokans.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0 shadow-glow-primary">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-white">Bespoke Timeline</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Build day-by-day itineraries, schedule private guides, track excursion investments, and synchronize with your companions.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0 shadow-glow-primary">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-white">Digital Pass & Dispatch</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Instant interactive booking modal with live pricing counters, add-ons, and instant generation of your frosted glass Digital Boarding Pass.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Step Glass Booking Modal (Supports both Packages & Direct Destination Quick-Books) */}
      <BookingModal
        travelPackage={selectedBookingPkg}
        destination={selectedDestinationForBooking}
        isOpen={Boolean(selectedBookingPkg || selectedDestinationForBooking)}
        onClose={() => {
          setSelectedBookingPkg(null);
          setSelectedDestinationForBooking(null);
        }}
      />

    </div>
  );
};
