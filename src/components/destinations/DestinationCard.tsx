import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Clock, ArrowUpRight, MapPin, Calendar, Sparkles, Compass } from 'lucide-react';
import { Destination } from '../../types/database';
import { useFavorites } from '../../contexts/FavoritesContext';
import { formatCurrency } from '../../lib/utils';

interface DestinationCardProps {
  destination: Destination;
  featured?: boolean;
  onQuickBook?: (destination: Destination) => void;
}

const DESTINATION_FALLBACK = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

export const DestinationCard: React.FC<DestinationCardProps> = ({ 
  destination, 
  featured = false,
  onQuickBook 
}) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(destination.id);

  const [imgSrc, setImgSrc] = useState<string>(
    () => destination.hero_image || destination.gallery_images?.[0] || DESTINATION_FALLBACK
  );
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(destination.gallery_images?.[0] || DESTINATION_FALLBACK);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(destination.id);
  };

  const handleQuickBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickBook) {
      onQuickBook(destination);
    } else {
      navigate(`/planner?destination=${destination.slug}`);
    }
  };

  return (
    <article
      className={`group relative rounded-3xl overflow-hidden glass-panel glass-panel-hover flex flex-col justify-between ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-2 md:items-stretch' : ''
      }`}
    >
      {/* Top Subtle Light Reflection Highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

      {/* Cinematic Image Container */}
      <div className={`relative overflow-hidden bg-surface-900/80 ${featured ? 'h-72 md:h-full min-h-[300px]' : 'h-64 sm:h-72'} w-full`}>
        {!imgLoaded && (
          <div className="absolute inset-0 bg-surface-800/60 animate-pulse flex items-center justify-center">
            <Compass className="w-8 h-8 text-primary/30 animate-spin" />
          </div>
        )}

        <img
          src={imgSrc}
          alt={destination.name}
          onLoad={() => setImgLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Multi-layered cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-primary shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {destination.category}
          </span>

          <button
            onClick={handleFavoriteClick}
            aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 shadow-md ${
              fav
                ? 'bg-rose-500/25 border-rose-500/50 text-rose-400 fill-rose-400 scale-110 shadow-glow-primary'
                : 'bg-black/50 border-white/20 text-white hover:text-rose-400 hover:scale-105 hover:bg-black/70'
            }`}
            title={fav ? 'Saved in Sanctuary Wishlist' : 'Save to Sanctuary Wishlist'}
          >
            <Heart className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${fav ? 'fill-rose-400' : ''}`} />
          </button>
        </div>

        {/* Bottom Floating Stats */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white z-10">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span className="font-bold tracking-tight">{destination.rating.toFixed(2)}</span>
            <span className="text-[10px] text-surface-400">(Curated)</span>
          </div>

          {destination.recommended_duration && (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-surface-200">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{destination.recommended_duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body & Dynamic Details */}
      <div className="p-6 flex flex-col flex-1 justify-between gap-5 relative z-10">
        <div className="space-y-2">
          {/* Location Pin & Country */}
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-bold">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{destination.country}</span>
          </div>

          {/* Destination Name */}
          <h3 className="font-display font-black text-2xl text-white group-hover:text-primary transition-colors tracking-tight">
            <Link to={`/destinations/${destination.slug}`} className="hover:underline">
              {destination.name}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-surface-300 line-clamp-2 leading-relaxed">
            {destination.description}
          </p>
        </div>

        {/* Bottom Financials & Interactive CTAs */}
        <div className="pt-4 border-t border-white/10 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">
                Estimated Budget
              </span>
              <span className="font-display font-extrabold text-lg text-white">
                {formatCurrency(destination.estimated_budget)}
                <span className="text-xs font-normal text-surface-400"> / guest</span>
              </span>
            </div>

            <Link
              to={`/destinations/${destination.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-surface-300 hover:text-white transition-colors"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Book CTA Button */}
          <button
            onClick={handleQuickBookClick}
            className="w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-white/[0.06] hover:bg-primary hover:text-white text-surface-200 border border-white/15 hover:border-primary/50 transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow-glow-primary"
          >
            <Calendar className="w-3.5 h-3.5 text-primary group-hover/btn:text-white transition-colors" />
            <span>Quick Book / Plan</span>
          </button>
        </div>
      </div>
    </article>
  );
};
