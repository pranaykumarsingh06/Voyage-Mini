import React from 'react';
import { Clock, Check, Sparkles, ArrowRight } from 'lucide-react';
import { TravelPackage } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../common/Button';

interface PackageCardProps {
  pkg: TravelPackage;
  onSelectBooking: (pkg: TravelPackage) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onSelectBooking }) => {
  return (
    <article className="rounded-3xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Banner image from destination or fallback */}
        <div className="relative h-60 w-full overflow-hidden">
          <img
            src={pkg.destination?.hero_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
            alt={pkg.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

          {/* Duration Badge */}
          <div className="absolute top-4 left-4">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-background/80 backdrop-blur-md border border-white/10 text-white">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {pkg.duration_days} Days / {pkg.duration_days - 1} Nights
            </span>
          </div>

          {/* Destination tag */}
          {pkg.destination && (
            <div className="absolute bottom-3 left-4">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                {pkg.destination.name}, {pkg.destination.country}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="font-display font-bold text-xl text-white group-hover:text-primary transition-colors leading-snug">
            {pkg.title}
          </h3>

          <p className="text-xs sm:text-sm text-surface-400 line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <span className="text-[11px] uppercase font-bold text-surface-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold" />
                Curated Highlights
              </span>
              <ul className="space-y-1.5 text-xs text-surface-300">
                {pkg.highlights.slice(0, 3).map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Reserve CTA */}
      <div className="p-6 pt-0">
        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-surface-400 block">Per Traveler</span>
            <span className="font-display font-black text-2xl text-white">
              {formatCurrency(pkg.price_per_person)}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectBooking(pkg)}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Reserve Journey
          </Button>
        </div>
      </div>
    </article>
  );
};
