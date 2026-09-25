import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Star, 
  Clock, 
  Calendar, 
  MapPin, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useDestination, useDestinations } from '../../hooks/useDestinations';
import { usePackages } from '../../hooks/usePackages';
import { useFavorites } from '../../contexts/FavoritesContext';
import { PackageCard } from '../../components/packages/PackageCard';
import { BookingModal } from '../../components/packages/BookingModal';
import { DestinationCard } from '../../components/destinations/DestinationCard';
import { TravelPackage } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/common/Button';

export const DestinationDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { destination, loading, error } = useDestination(slug);
  const { destinations } = useDestinations();
  const { packages } = usePackages(destination?.id);
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedBookingPkg, setSelectedBookingPkg] = useState<TravelPackage | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="h-[60vh] rounded-3xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="max-w-md mx-auto text-center py-28 px-4 space-y-4">
        <h2 className="font-display font-bold text-3xl text-white">Sanctuary Not Found</h2>
        <p className="text-sm text-surface-400">The destination requested could not be retrieved from our private atlas.</p>
        <Link to="/explore">
          <Button variant="primary">Return to Atlas</Button>
        </Link>
      </div>
    );
  }

  const gallery = [destination.hero_image, ...(destination.gallery_images || [])];
  const fav = isFavorite(destination.id);

  // Related destinations in same category or continent
  const relatedDestinations = destinations
    .filter(d => d.id !== destination.id && (d.category === destination.category || d.country === destination.country))
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-16 pb-24">
      
      {/* 1. Cinematic Hero Header Gallery */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full glass-panel hover:border-primary/50 text-surface-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              title="Copy Sanctuary Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => toggleFavorite(destination.id)}
              className={`p-2.5 rounded-full glass-panel transition-all ${
                fav ? 'border-rose-500/40 text-rose-400 fill-rose-400' : 'hover:border-primary/50 text-surface-300 hover:text-rose-400'
              }`}
              title={fav ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${fav ? 'fill-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hero Main Viewport */}
        <div className="relative rounded-3xl overflow-hidden h-[50vh] sm:h-[65vh] border border-border-strong shadow-2xl">
          <img
            src={gallery[activeImageIndex] || destination.hero_image}
            alt={destination.name}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Floating Details Overlay */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/90 text-white backdrop-blur-md">
                {destination.category}
              </span>
              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white">
                {destination.name}
              </h1>
              <p className="text-sm sm:text-base text-surface-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{destination.country}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-gold font-bold">
                  <Star className="w-3.5 h-3.5 fill-gold" /> {destination.rating.toFixed(2)}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link to={`/planner?destination=${destination.id}`}>
                <Button variant="primary" size="md" icon={<Compass className="w-4 h-4" />}>
                  Plan Itinerary Here
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gallery Thumbnails */}
        {gallery.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative rounded-2xl overflow-hidden w-24 h-16 shrink-0 border-2 transition-all ${
                  activeImageIndex === idx ? 'border-primary scale-105 shadow-glow-primary' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

      </section>

      {/* 2. Destination Core Specifications & Summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Description & Curator Notes */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-3">
              The Sanctuary Experience
            </h2>
            <p className="text-sm sm:text-base text-surface-300 leading-relaxed font-light">
              {destination.description}
            </p>
          </div>

          {/* Highlights & Inclusions */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-subtle space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Curator Travel Intel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-surface-300">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle space-y-1">
                <span className="text-surface-500 font-bold uppercase text-[10px]">Optimal Season</span>
                <p className="text-white font-medium">{destination.best_time_to_visit || 'Year-round availability'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle space-y-1">
                <span className="text-surface-500 font-bold uppercase text-[10px]">Recommended Stay</span>
                <p className="text-white font-medium">{destination.recommended_duration || '5-7 Days'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle space-y-1">
                <span className="text-surface-500 font-bold uppercase text-[10px]">Average Investment</span>
                <p className="text-white font-medium">{formatCurrency(destination.estimated_budget)} / traveler</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle space-y-1">
                <span className="text-surface-500 font-bold uppercase text-[10px]">Purity Rating</span>
                <p className="text-gold font-bold">{destination.rating.toFixed(2)} &bull; Verified Sanctuary</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Reservation Card */}
        <div>
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong sticky top-28 space-y-6">
            <div>
              <span className="text-[11px] uppercase font-bold text-surface-400 block mb-1">
                Sanctuary Investment
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl text-white">
                  {formatCurrency(destination.estimated_budget)}
                </span>
                <span className="text-xs text-surface-400">est. baseline</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-border-subtle text-xs text-surface-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Private ground and air transfers arranged</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>24/7 dedicated bilingual host and guide</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Flexible cancellation up to 14 days prior</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link to={`/planner?destination=${destination.id}`}>
                <Button variant="primary" size="lg" className="w-full">
                  Create Custom Itinerary
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* 3. Available Packages for this Destination */}
      {packages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary block mb-1">
              Curated Itineraries
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Signature Travel Packages for {destination.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelectBooking={(p) => setSelectedBookingPkg(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Related Sanctuaries */}
      {relatedDestinations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary block mb-1">
              Curated Pairings
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Similar Sanctuaries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedDestinations.map((rel) => (
              <DestinationCard key={rel.id} destination={rel} />
            ))}
          </div>
        </section>
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
