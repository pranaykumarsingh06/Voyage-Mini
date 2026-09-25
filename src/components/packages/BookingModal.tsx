import React, { useState } from 'react';
import { X, Calendar, Users, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TravelPackage } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

interface BookingModalProps {
  travelPackage: TravelPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ travelPackage, isOpen, onClose }) => {
  const { profile } = useAuth();
  const { createBooking } = useBookings();
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !travelPackage) return null;

  const totalAmount = travelPackage.price_per_person * travelers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) return;

    setIsSubmitting(true);
    try {
      await createBooking({
        package_id: travelPackage.id,
        travel_date: travelDate,
        travelers,
        total_amount: totalAmount,
      });
      setConfirmed(true);
    } catch (err) {
      console.error('[BookingModal] Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmed(false);
    setTravelDate('');
    setTravelers(2);
    setSpecialRequests('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong shadow-2xl overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl -z-10" />

        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.05] border border-border-subtle flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {confirmed ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white">Booking Request Received</h3>
            <p className="text-sm text-surface-300 max-w-sm mx-auto leading-relaxed">
              Your reservation for <strong className="text-white">{travelPackage.title}</strong> has been logged into our concierge dispatch system.
            </p>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-border-subtle text-xs text-surface-400 space-y-1.5 text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span>Travel Date:</span>
                <span className="text-white font-semibold">{travelDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Party Size:</span>
                <span className="text-white font-semibold">{travelers} Guests</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Total:</span>
                <span className="text-primary font-bold text-sm">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={handleReset} className="w-full">
                Return to Voyage
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Concierge Booking
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                {travelPackage.title}
              </h3>
              <p className="text-xs text-surface-400 mt-1">
                {travelPackage.duration_days} Days &bull; {formatCurrency(travelPackage.price_per_person)} / person
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Preferred Departure Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Travelers Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Number of Guests
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full bg-background-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                  Special Concierge Requests
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Dietary preferences, private heli transfers, champagne suite reception..."
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-xs text-surface-400 block">Total Investment</span>
                <span className="text-[11px] text-surface-500">Taxes & concierge fees included</span>
              </div>
              <span className="font-display font-extrabold text-2xl text-white">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Submit */}
            <div className="space-y-2 pt-2">
              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
                Submit Reservation Request
              </Button>
              <p className="text-[11px] text-surface-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No immediate payment required &bull; 100% Verified Concierge
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
