import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Calendar, ArrowRight, Sparkles, MapPin, Shield, Star, Award, ChevronDown } from 'lucide-react';
import { useDestinations } from '../../hooks/useDestinations';
import { usePackages } from '../../hooks/usePackages';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { PackageCard } from '../../components/packages/PackageCard';
import { BookingModal } from '../../components/packages/BookingModal';
import { TravelPackage, DestinationCategory } from '../../types/database';
import { Button } from '../../components/common/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { destinations, loading: destLoading } = useDestinations();
  const { packages, loading: pkgLoading } = usePackages();
  const [selectedBookingPkg, setSelectedBookingPkg] = useState<TravelPackage | null>(null);

  // Search Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/explore?${params.toString()}`);
  };

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

  const featuredDestinations = destinations.slice(0, 4);
  const trendingPackages = packages.slice(0, 3);

  return (
    <div className="space-y-28 pb-20">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Image with Parallax Vibe */}
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85"
            alt="Cinematic Alpine Lake"
            className="w-full h-full object-cover scale-105"
          />
          {/* Multi-layered cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/40 to-background/80" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 z-10 pt-10">
          
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-primary text-xs font-bold uppercase tracking-widest animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Curated Global Sanctuaries
          </div>

          {/* Oversized Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[1.05]">
            THE WORLD IS <br />
            <span className="text-gradient">YOURS TO EXPLORE.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-surface-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Unrivaled private expeditions, bespoke multi-day itineraries, and secluded architectural sanctuaries hand-selected for discerning travelers.
          </p>

          {/* Glass Search & Filter Console */}
          <form
            onSubmit={handleSearchSubmit}
            className="rounded-3xl glass-panel p-2.5 sm:p-3 border border-white/20 shadow-2xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2 text-left"
          >
            <div className="sm:col-span-6 flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] rounded-2xl border border-border-subtle">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where would you like to escape?"
                className="w-full bg-transparent text-sm text-white placeholder:text-surface-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex items-center px-3 py-2.5 bg-white/[0.03] rounded-2xl border border-border-subtle">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-surface-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-background-secondary text-white">All Styles</option>
                <option value="Luxury" className="bg-background-secondary text-white">Luxury</option>
                <option value="Cultural" className="bg-background-secondary text-white">Cultural</option>
                <option value="Beaches" className="bg-background-secondary text-white">Beaches</option>
                <option value="Mountains" className="bg-background-secondary text-white">Mountains</option>
                <option value="Wildlife" className="bg-background-secondary text-white">Wildlife</option>
                <option value="Adventure" className="bg-background-secondary text-white">Adventure</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" size="md" className="w-full h-full py-3" icon={<Search className="w-4 h-4" />}>
                Discover
              </Button>
            </div>
          </form>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/explore">
              <Button variant="outline" size="md" icon={<Compass className="w-4 h-4" />}>
                Explore Destinations
              </Button>
            </Link>
            <Link to="/planner">
              <Button variant="gold" size="md" icon={<Calendar className="w-4 h-4" />}>
                Plan Your Journey
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

      {/* 2. Featured Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1.5">
              <Award className="w-3.5 h-3.5 text-gold" />
              World-Class Escapes
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Featured Sanctuaries
            </h2>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors">
            <span>Browse All 50+ Destinations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {destLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Explore By Experience */}
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
              className="group relative rounded-3xl overflow-hidden h-64 border border-border-subtle glass-panel-hover"
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
                <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-primary group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Trending Journeys & Packages */}
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
              <div key={i} className="h-96 rounded-3xl bg-white/[0.03] animate-pulse" />
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
        <div className="rounded-3xl glass-panel p-8 sm:p-14 border border-border-subtle relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
              The Architecture of Travel
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              How Voyage Works
            </h2>
            <p className="text-xs sm:text-sm text-surface-400">
              Three seamless steps from inspiration to private sanctuary arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-border-subtle">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-white">Curated Discovery</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Filter by aesthetic, continent, and budget to uncover verified hotels, hidden calderas, and private ryokans.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-border-subtle">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-white">Bespoke Timeline</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Build day-by-day itineraries, schedule private guides, track excursion investments, and synchronize with your companions.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-border-subtle">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-black text-xl mx-auto sm:mx-0">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-white">Direct Dispatch</h3>
              <p className="text-xs text-surface-400 leading-relaxed">
                Request verified packages, receive concierge dispatch confirmations, and access all your reservations anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        travelPackage={selectedBookingPkg}
        isOpen={Boolean(selectedBookingPkg)}
        onClose={() => setSelectedBookingPkg(null)}
      />

    </div>
  );
};
