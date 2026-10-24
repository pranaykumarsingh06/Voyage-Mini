import React, { useState } from 'react';
import { Clock, Check, Sparkles, ArrowRight, MapPin, Compass } from 'lucide-react';
import { TravelPackage } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../common/Button';

interface PackageCardProps {
  pkg: TravelPackage;
  onSelectBooking: (pkg: TravelPackage) => void;
}

const THEMATIC_FALLBACKS: Record<string, string> = {
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  amalfi: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  italy: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
  greece: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
  swiss: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  alps: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
};

const resolvePackageImage = (pkg: TravelPackage): string => {
  if (pkg.destination?.hero_image && pkg.destination.hero_image.trim()) {
    return pkg.destination.hero_image;
  }
  if (pkg.image_url && pkg.image_url.trim()) {
    return pkg.image_url;
  }
  if ((pkg as any).hero_image && (pkg as any).hero_image.trim()) {
    return (pkg as any).hero_image;
  }
  if (pkg.destination?.gallery_images && pkg.destination.gallery_images.length > 0) {
    return pkg.destination.gallery_images[0];
  }
  const text = `${pkg.title} ${pkg.destination?.name || ''} ${pkg.destination?.country || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(THEMATIC_FALLBACKS)) {
    if (text.includes(key)) return url;
  }
  return THEMATIC_FALLBACKS.default;
};

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onSelectBooking }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => resolvePackageImage(pkg));
  const [imgErrorCount, setImgErrorCount] = useState<number>(0);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const handleImageError = () => {
    if (imgErrorCount === 0) {
      // First fallback: attempt secondary high-resolution sanctuary fallback
      setImgErrorCount(1);
      const text = `${pkg.title} ${pkg.destination?.name || ''}`.toLowerCase();
      if (text.includes('kyoto') || text.includes('zen')) {
        setImgSrc('https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80');
      } else if (text.includes('amalfi') || text.includes('yacht')) {
        setImgSrc('https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80');
      } else {
        setImgSrc(THEMATIC_FALLBACKS.default);
      }
    } else if (imgErrorCount === 1) {
      // Second fallback: universal scenic tropical sanctuary
      setImgErrorCount(2);
      setImgSrc('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80');
    } else {
      // Permanent fallback: activate graceful vector banner
      setImgErrorCount(3);
      setImgLoaded(true);
    }
  };

  return (
    <article className="rounded-3xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between group border border-white/15 relative">
      {/* Top Refractive Light Highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

      <div>
        {/* Banner image with shimmer & resilient fallbacks */}
        <div className="relative h-60 w-full overflow-hidden bg-surface-900/80">
          
          {/* Shimmer Placeholder while loading */}
          {!imgLoaded && imgErrorCount < 3 && (
            <div className="absolute inset-0 bg-surface-800/60 animate-pulse flex items-center justify-center">
              <Compass className="w-8 h-8 text-primary/30 animate-spin" />
            </div>
          )}

          {imgErrorCount < 3 ? (
            <img
              src={imgSrc}
              alt={pkg.title}
              onLoad={() => setImgLoaded(true)}
              onError={handleImageError}
              className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-108 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            /* Graceful Vector Luxury Sanctuary Banner if CDN is unreachable */
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-surface-900 to-gold/20 flex flex-col items-center justify-center p-6 text-center">
              <Sparkles className="w-10 h-10 text-gold mb-2 animate-bounce" />
              <span className="font-display font-extrabold text-white text-base tracking-wide">
                {pkg.destination?.name || 'Exclusive Sanctuary'}
              </span>
              <span className="text-[11px] text-surface-400 uppercase tracking-widest mt-1">
                Private Expedition
              </span>
            </div>
          )}

          {/* Contrast-enhancing gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />

          {/* Duration Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-sm">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {pkg.duration_days} Days / {pkg.duration_days - 1} Nights
            </span>
          </div>

          {/* Destination tag */}
          {pkg.destination && (
            <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase drop-shadow-md">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span className="text-white drop-shadow">{pkg.destination.name}, {pkg.destination.country}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="font-display font-bold text-xl text-white group-hover:text-primary transition-colors leading-snug">
            {pkg.title}
          </h3>

          <p className="text-xs sm:text-sm text-surface-300 line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
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
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Per Traveler</span>
            <span className="font-display font-black text-2xl text-white">
              {formatCurrency(pkg.price_per_person)}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectBooking(pkg)}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            className="shadow-glow-primary"
          >
            Reserve Journey
          </Button>
        </div>
      </div>
    </article>
  );
};
