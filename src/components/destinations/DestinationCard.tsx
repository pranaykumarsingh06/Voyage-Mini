import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Clock, ArrowUpRight, DollarSign } from 'lucide-react';
import { Destination } from '../../types/database';
import { useFavorites } from '../../contexts/FavoritesContext';
import { formatCurrency } from '../../lib/utils';

interface DestinationCardProps {
  destination: Destination;
  featured?: boolean;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination, featured = false }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(destination.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(destination.id);
  };

  return (
    <article
      className={`group relative rounded-3xl overflow-hidden glass-panel glass-panel-hover flex flex-col ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-2 md:items-center' : ''
      }`}
    >
      {/* Cinematic Image Container */}
      <div className={`relative overflow-hidden ${featured ? 'h-72 md:h-full' : 'h-64 sm:h-72'} w-full`}>
        <img
          src={destination.hero_image}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-background/70 backdrop-blur-md border border-white/10 text-primary">
            {destination.category}
          </span>

          <button
            onClick={handleFavoriteClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
              fav
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 fill-rose-400 scale-110'
                : 'bg-background/60 border-white/15 text-white hover:text-rose-400 hover:scale-105'
            }`}
            title={fav ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-rose-400' : ''}`} />
          </button>
        </div>

        {/* Bottom Floating Stats */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white z-10">
          <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span className="font-bold">{destination.rating.toFixed(2)}</span>
          </div>

          {destination.recommended_duration && (
            <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-surface-300">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{destination.recommended_duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1 justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            {destination.country}
          </span>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-primary transition-colors mt-0.5">
            {destination.name}
          </h3>
          <p className="text-xs sm:text-sm text-surface-400 line-clamp-2 mt-2 leading-relaxed">
            {destination.description}
          </p>
        </div>

        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400 block">Est. Budget</span>
            <span className="font-display font-bold text-base text-white">
              {formatCurrency(destination.estimated_budget)}
            </span>
          </div>

          <Link
            to={`/destinations/${destination.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-primary-hover transition-colors"
          >
            <span>Explore Sanctuary</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
