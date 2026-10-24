import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Calendar, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  MapPin, 
  Plane, 
  Compass, 
  ArrowRight, 
  ArrowLeft,
  Crown,
  Coffee,
  Car,
  Shield,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { TravelPackage, Destination } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

interface BookingModalProps {
  travelPackage?: TravelPackage | null;
  destination?: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

type TierType = 'comfort' | 'premium' | 'luxury';

export const BookingModal: React.FC<BookingModalProps> = ({ 
  travelPackage, 
  destination,
  isOpen, 
  onClose 
}) => {
  const { profile } = useAuth();
  const { createBooking } = useBookings();
  const navigate = useNavigate();

  // Multi-Step State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Trip Parameters
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [travelers, setTravelers] = useState(2);
  const [selectedTier, setSelectedTier] = useState<TierType>('premium');

  // Step 2: Add-on Experiences
  const [addOnGuide, setAddOnGuide] = useState(true);
  const [addOnTransfer, setAddOnTransfer] = useState(true);
  const [addOnAdventure, setAddOnAdventure] = useState(false);
  const [addOnInsurance, setAddOnInsurance] = useState(true);

  // Step 3: Passenger Details
  const [leadPassenger, setLeadPassenger] = useState(profile?.full_name || 'Guest Traveler');
  const [contactEmail, setContactEmail] = useState(profile?.email || 'traveler@voyage.luxury');
  const [contactPhone, setContactPhone] = useState('+1 (555) 789-2341');
  const [specialRequests, setSpecialRequests] = useState('Champagne welcome reception upon arrival; vegetarian dietary request.');

  // Step 4: Digital Boarding Pass State
  const [pnrCode, setPnrCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen || (!travelPackage && !destination)) return null;

  // Resolve active package or synthesize one from destination
  const activePkg: TravelPackage = travelPackage || {
    id: `synth-${destination?.id || 'd1'}`,
    destination_id: destination?.id || 'd1',
    title: `${destination?.name} Bespoke Expedition`,
    description: destination?.description || 'Curated luxury sanctuary experience.',
    duration_days: parseInt(destination?.recommended_duration || '7', 10) || 7,
    price_per_person: destination?.estimated_budget || 2800,
    highlights: [
      `Private access & VIP entry in ${destination?.name}`,
      'Hand-selected 5-Star Architectural Suite',
      'Personal English-speaking Concierge & Historian',
      'Private Chauffeur Valet Transfers'
    ],
    inclusions: [
      'Boutique suite accommodation',
      'Daily gourmet breakfast & signature dinners',
      'All local luxury ground transfers',
      '24/7 dedicated travel concierge'
    ],
    exclusions: ['International long-haul flights', 'Discretionary tips'],
    availability: ['Spring 2026', 'Summer 2026', 'Autumn 2026'],
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    destination: destination || undefined
  };

  const destinationName = activePkg.destination?.name || destination?.name || 'Curated Sanctuary';
  const destinationCountry = activePkg.destination?.country || destination?.country || 'Global';

  // Tier multiplier
  const tierMultipliers: Record<TierType, { multiplier: number; label: string; desc: string }> = {
    comfort: { multiplier: 1.0, label: 'Comfort Sanctuary', desc: 'Deluxe Suite with private terrace & breakfast' },
    premium: { multiplier: 1.35, label: 'Premium Executive', desc: 'Panoramic Balcony Suite, priority concierge & club access' },
    luxury: { multiplier: 1.75, label: 'Ultra Luxury Villa', desc: 'Presidential Penthouse, private plunge pool & dedicated butler' },
  };

  // Real-time calculation
  const basePricePerPerson = Math.round(activePkg.price_per_person * tierMultipliers[selectedTier].multiplier);
  const passengersSubtotal = basePricePerPerson * travelers;

  const guideFee = addOnGuide ? 350 : 0;
  const transferFee = addOnTransfer ? 480 : 0;
  const adventureFee = addOnAdventure ? 280 : 0;
  const insuranceFee = addOnInsurance ? 180 : 0;
  const addOnsTotal = guideFee + transferFee + adventureFee + insuranceFee;

  const taxesAndFees = Math.round((passengersSubtotal + addOnsTotal) * 0.08);
  const grandTotal = passengersSubtotal + addOnsTotal + taxesAndFees;

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!profile) {
      onClose();
      navigate('/auth/signin', { state: { from: window.location.pathname } });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Generate futuristic PNR code
    const generatedPnr = `VYG-${Math.floor(10000 + Math.random() * 90000)}`;
    setPnrCode(generatedPnr);

    try {
      const validPkgId = travelPackage ? travelPackage.id : (activePkg.id.startsWith('synth-') ? null : activePkg.id);
      const destId = destination?.id || activePkg.destination_id || activePkg.destination?.id || null;

      const created = await createBooking({
        package_id: validPkgId,
        destination_id: destId && !destId.startsWith('synth-') ? destId : null,
        destination_name: destinationName,
        destination_image: destination?.hero_image || activePkg.destination?.hero_image || activePkg.image_url || null,
        destination_location: destinationCountry,
        travel_date: travelDate,
        travelers,
        guests: travelers,
        total_amount: grandTotal,
        total_price: grandTotal,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        special_requests: specialRequests,
        tier: selectedTier,
        pnr_code: generatedPnr,
      });

      if (created?.pnr_code) {
        setPnrCode(created.pnr_code);
      }
      setStep(4);
    } catch (err: any) {
      console.error('[BookingModal] createBooking error:', err);
      setSubmitError(err?.message || 'Unable to complete your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPnr = () => {
    if (!pnrCode) return;
    navigator.clipboard.writeText(pnrCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrintPass = () => {
    window.print();
  };

  const handleResetAndClose = () => {
    setStep(1);
    setIsCopied(false);
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-modal-overlay animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl glass-boarding-pass p-5 sm:p-8 border border-white/20 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Top Radial Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-gold/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Close Modal Button */}
        <button
          onClick={handleResetAndClose}
          className="print-hide absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/15 flex items-center justify-center text-surface-300 hover:text-white transition-all z-30"
          aria-label="Close booking modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Stepper (Hidden in Print Mode & Step 4) */}
        {step < 4 && (
          <div className="print-hide mb-6 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-surface-400">
              <span className={step >= 1 ? 'text-primary' : ''}>1. Parameters & Tier</span>
              <span className={step >= 2 ? 'text-primary' : ''}>2. Add-Ons</span>
              <span className={step >= 3 ? 'text-primary' : ''}>3. Passenger Info</span>
              <span className="text-surface-500">4. Boarding Pass</span>
            </div>
            
            {/* Visual Step Bar */}
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 1: Trip Parameters & Tier Selection
           ------------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Step 1 &bull; Trip Parameters
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                {activePkg.title}
              </h2>
              <p className="text-xs sm:text-sm text-surface-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{destinationName}, {destinationCountry}</span>
                <span className="text-surface-500">&bull;</span>
                <span>{activePkg.duration_days} Days / {activePkg.duration_days - 1} Nights</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Departure Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium"
                />
              </div>

              {/* Guest Count */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Party Size
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full glass-input bg-background-secondary rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num} className="bg-background-secondary text-white">
                      {num} {num === 1 ? 'Guest (Solo Traveler)' : `${num} Guests`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room / Experience Tier Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-gold" />
                Select Sanctuary Tier
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['comfort', 'premium', 'luxury'] as TierType[]).map((tierKey) => {
                  const t = tierMultipliers[tierKey];
                  const active = selectedTier === tierKey;
                  const price = Math.round(activePkg.price_per_person * t.multiplier);

                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedTier(tierKey)}
                      className={`p-3.5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between gap-2 ${
                        active
                          ? 'bg-primary/20 border-primary shadow-glow-primary'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold uppercase ${active ? 'text-primary' : 'text-white'}`}>
                            {t.label.split(' ')[0]}
                          </span>
                          {tierKey === 'luxury' && (
                            <span className="text-[9px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded font-bold">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-surface-400 mt-1 line-clamp-2">
                          {t.desc}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                        <span className="text-[10px] text-surface-400">Rate</span>
                        <span className="font-display font-bold text-sm text-white">
                          {formatCurrency(price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Subtotal Pill */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-surface-400">Base Investment ({travelers} Travelers)</span>
                <span className="text-[11px] text-surface-500 block">Tier: {tierMultipliers[selectedTier].label}</span>
              </div>
              <span className="font-display font-black text-2xl text-white">
                {formatCurrency(passengersSubtotal)}
              </span>
            </div>

            {/* Next Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setStep(2)}
              className="w-full justify-center"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Experience Add-ons
            </Button>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 2: Add-on Experiences & Live Price Counter
           ------------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Step 2 &bull; Bespoke Add-ons
              </span>
              <h2 className="font-display font-black text-2xl text-white">
                Elevate Your Journey
              </h2>
              <p className="text-xs text-surface-300 mt-0.5">
                Select exclusive concierge enhancements. Live pricing updates automatically.
              </p>
            </div>

            {/* Add-on Checkbox Cards */}
            <div className="space-y-3">
              {/* 1. Guide */}
              <label 
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  addOnGuide ? 'bg-primary/15 border-primary/60' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={addOnGuide}
                    onChange={(e) => setAddOnGuide(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold text-sm text-white">
                        Private Historian & Expert Guide
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Dedicated English-speaking cultural curator for all excursions
                    </p>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-gold shrink-0">+$350</span>
              </label>

              {/* 2. Transfer */}
              <label 
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  addOnTransfer ? 'bg-primary/15 border-primary/60' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={addOnTransfer}
                    onChange={(e) => setAddOnTransfer(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold text-sm text-white">
                        VIP Mercedes / Helicopter Airport Transfer
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Private tarmac escort and seamless direct transfer to accommodation
                    </p>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-gold shrink-0">+$480</span>
              </label>

              {/* 3. Adventure Pack */}
              <label 
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  addOnAdventure ? 'bg-primary/15 border-primary/60' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={addOnAdventure}
                    onChange={(e) => setAddOnAdventure(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold text-sm text-white">
                        Bespoke Adventure & Expedition Gear Pack
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      High-end optical binoculars, custom all-weather gear, and field passes
                    </p>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-gold shrink-0">+$280</span>
              </label>

              {/* 4. Insurance */}
              <label 
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  addOnInsurance ? 'bg-primary/15 border-primary/60' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={addOnInsurance}
                    onChange={(e) => setAddOnInsurance(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="font-display font-bold text-sm text-white">
                        Comprehensive Global Travel Protection & Medical
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">
                      100% cancellation protection, emergency medical & luggage guarantee
                    </p>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-gold shrink-0">+$180</span>
              </label>
            </div>

            {/* Live Counter Display */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-surface-400">Total with Selected Add-ons</span>
                <span className="text-[11px] text-surface-500 block">Add-ons subtotal: {formatCurrency(addOnsTotal)}</span>
              </div>
              <span className="font-display font-black text-2xl text-primary">
                {formatCurrency(passengersSubtotal + addOnsTotal)}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                className="flex-1 justify-center"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Traveler Details
              </Button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 3: Passenger Details & Confirmation
           ------------------------------------------------------------- */}
        {step === 3 && (
          <form onSubmit={handleConfirmReservation} className="space-y-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Step 3 &bull; Lead Traveler Dossier
              </span>
              <h2 className="font-display font-black text-2xl text-white">
                Finalize Reservation
              </h2>
              <p className="text-xs text-surface-300 mt-0.5">
                Confirm your dispatch contact and special requests before pass generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-300">
                  Lead Traveler Name
                </label>
                <input
                  type="text"
                  required
                  value={leadPassenger}
                  onChange={(e) => setLeadPassenger(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium"
                  placeholder="Elena Rostova"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-300">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium"
                  placeholder="elena@voyage.luxury"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-300">
                Direct Contact Phone (for Concierge Dispatch)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium"
                placeholder="+1 (555) 789-2341"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-300">
                Special Concierge Requests
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium resize-none"
                placeholder="Dietary preferences, champagne suite reception, helicopter landing specs..."
              />
            </div>

            {/* Itemized Financial Summary Table */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-surface-300">
                <span>{tierMultipliers[selectedTier].label} ({travelers} Travelers &times; {formatCurrency(basePricePerPerson)})</span>
                <span className="font-semibold text-white">{formatCurrency(passengersSubtotal)}</span>
              </div>
              {addOnGuide && (
                <div className="flex justify-between text-surface-400">
                  <span>&bull; Private Historian & Guide</span>
                  <span>+$350</span>
                </div>
              )}
              {addOnTransfer && (
                <div className="flex justify-between text-surface-400">
                  <span>&bull; VIP Airport / Heli Transfer</span>
                  <span>+$480</span>
                </div>
              )}
              {addOnAdventure && (
                <div className="flex justify-between text-surface-400">
                  <span>&bull; Adventure Gear Pack</span>
                  <span>+$280</span>
                </div>
              )}
              {addOnInsurance && (
                <div className="flex justify-between text-surface-400">
                  <span>&bull; Global Travel Protection</span>
                  <span>+$180</span>
                </div>
              )}
              <div className="flex justify-between text-surface-400 pt-1 border-t border-white/10">
                <span>Taxes & Concierge Dispatch Fee (8%)</span>
                <span>{formatCurrency(taxesAndFees)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/15">
                <span>Total Master Investment</span>
                <span className="text-primary text-base font-display">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Error Feedback */}
            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {/* Confirmation & Submission */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1 justify-center font-display tracking-wider"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isSubmitting ? 'Confirming with Concierge...' : 'Confirm Booking & Generate Pass'}
              </Button>
            </div>
            
            <p className="text-[11px] text-surface-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero deposit risk &bull; Guaranteed priority dispatch &bull; Supabase Persistent Ledger
            </p>
          </form>
        )}

        {/* -------------------------------------------------------------
            STEP 4: The "All-Inclusive" Digital Boarding Pass & Dossier
           ------------------------------------------------------------- */}
        {step === 4 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-400">
            {/* Success Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-primary">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
                Reservation Confirmed & Verified
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Booking Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-300 font-medium max-w-md mx-auto">
                Your trip has been added to My Trips.
              </p>
              <p className="text-xs text-surface-400 max-w-md mx-auto">
                Stored persistently in Supabase and ready for your arrival.
              </p>
            </div>

            {/* The Actual Digital Glass Boarding Pass Card */}
            <div id="digital-boarding-pass" className="rounded-3xl p-6 sm:p-7 border border-white/20 bg-black/60 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
              
              {/* Header of Pass */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-dashed border-white/20 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center font-display font-black text-white text-xl">
                    V
                  </div>
                  <div>
                    <span className="font-display font-extrabold text-lg text-white tracking-widest">
                      VOYAGE BESPOKE PASS
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-surface-400 block font-semibold">
                      Class: {tierMultipliers[selectedTier].label}
                    </span>
                  </div>
                </div>

                {/* PNR Code Pill */}
                <div className="flex items-center gap-2">
                  <div className="bg-white/[0.06] border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-surface-400">PNR</span>
                    <span className="font-mono font-extrabold text-sm text-primary tracking-wider">
                      {pnrCode || 'VYG-94821'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyPnr}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 text-surface-300 hover:text-white transition-colors"
                    title="Copy PNR"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Route & Destination Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Origin</span>
                  <span className="font-display font-bold text-base text-white">VIP Concierge</span>
                  <span className="text-xs text-surface-400 block">Global Departure</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-full flex items-center justify-center gap-2 text-primary">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/60" />
                    <Plane className="w-4 h-4 text-gold transform rotate-90" />
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/60" />
                  </div>
                  <span className="text-[10px] font-bold text-surface-400 mt-1 uppercase tracking-wider">
                    {activePkg.duration_days} Days Journey
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Sanctuary</span>
                  <span className="font-display font-bold text-base text-white">{destinationName}</span>
                  <span className="text-xs text-primary font-semibold block">{destinationCountry}</span>
                </div>
              </div>

              {/* Key Passenger & Travel Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Lead Traveler</span>
                  <span className="font-bold text-white truncate block">{leadPassenger}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Party Size</span>
                  <span className="font-bold text-white">{travelers} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Departure Date</span>
                  <span className="font-bold text-white">{travelDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Total Investment</span>
                  <span className="font-bold text-gold">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Itemized Receipt & Verified Inclusions */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-surface-400 block">
                  Verified Inclusions
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> 5-Star Accommodations
                  </span>
                  {addOnGuide && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Private Historian Guide
                    </span>
                  )}
                  {addOnTransfer && (
                    <span className="px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-semibold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> VIP Heli / Chauffeur Transfer
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-surface-300 font-semibold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> 24/7 Concierge Hotline
                  </span>
                </div>
              </div>

              {/* Bottom Perforated Section with Futuristic QR Code */}
              <div className="pt-4 border-t border-dashed border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                    {/* Stylized high-res QR representation */}
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider block">
                      Verification Barcode & Ledger Token
                    </span>
                    <span className="font-mono text-[11px] text-white">
                      SHA256: {pnrCode || 'VYG'}-{Math.random().toString(36).substring(2, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-surface-400 block font-semibold">Payment Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 sm:justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed / On Account
                  </span>
                </div>
              </div>

            </div>

            {/* Action Buttons: Print, Save, Explore */}
            <div className="print-hide flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintPass}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-primary" />
                <span>Print / Download Glass Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/bookings');
                }}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-glow-primary"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>View in My Trips</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-surface-400 hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
