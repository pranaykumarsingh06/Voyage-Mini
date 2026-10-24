import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Printer, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Plane, 
  Crown, 
  RefreshCw,
  QrCode,
  Tag
} from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { Booking, BookingStatus } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/common/Button';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, loading, error, cancelBooking, refreshBookings } = useBookings();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Booking for Details Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Cancellation Modal state
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // PNR copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPnr = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelBooking(bookingToCancel.id);
      // If modal was viewing this booking, update it
      if (selectedBooking && selectedBooking.id === bookingToCancel.id) {
        setSelectedBooking({ ...selectedBooking, status: 'cancelled' });
      }
      setBookingToCancel(null);
    } catch (err: any) {
      console.error('[MyBookingsPage] Cancellation error:', err);
      setCancelError(err?.message || 'Unable to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const destName = b.destination_name || b.package?.title || 'Curated Sanctuary';
    const matchesSearch = 
      !searchTerm ||
      destName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.destination_location && b.destination_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.pnr_code && b.pnr_code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      
      {/* 1. Page Header Banner */}
      <section className="rounded-3xl glass-panel p-6 sm:p-10 border border-border-strong relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Traveler Portfolio
            </span>
            <span className="text-surface-500">&bull;</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Supabase Verified
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            My Trips
          </h1>

          <p className="text-xs sm:text-base text-surface-300 max-w-xl font-light">
            All your booked destinations in one place. Access itinerary documents, view concierge dispatches, or print your Digital Boarding Pass.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => refreshBookings()}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            disabled={loading}
          >
            Refresh
          </Button>

          <Link to="/explore">
            <Button
              variant="primary"
              size="md"
              icon={<Compass className="w-4 h-4" />}
              className="shadow-glow-primary"
            >
              Explore Destinations
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Filters & Search Toolbar */}
      <section className="rounded-2xl glass-panel p-4 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            All Trips ({bookings.length})
          </button>

          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'cancelled'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search destination, PNR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-primary"
          />
        </div>
      </section>

      {/* 3. Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshBookings()}>
            Try Again
          </Button>
        </div>
      )}

      {/* 4. Loading Skeleton State */}
      {loading && bookings.length === 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12 gap-3 text-surface-400 text-sm">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading your trips...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl glass-panel h-80 animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      )}

      {/* 5. Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="rounded-3xl glass-panel p-12 sm:p-16 text-center max-w-lg mx-auto border border-white/10 space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-glow-primary">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display font-black text-2xl text-white">
              {searchTerm || statusFilter !== 'all' ? 'No Matching Trips Found' : 'No trips booked yet'}
            </h3>
            <p className="text-xs sm:text-sm text-surface-400 leading-relaxed font-light">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search query or switching to the "All Trips" tab.'
                : 'Start exploring destinations and plan your next adventure.'}
            </p>
          </div>

          <div className="pt-2">
            {searchTerm || statusFilter !== 'all' ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Link to="/explore">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Compass className="w-4 h-4" />}
                  className="shadow-glow-primary"
                >
                  Explore Destinations
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 6. Bookings Grid */}
      {!loading && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === 'confirmed';
            const isCancelled = booking.status === 'cancelled';
            const fallbackImage = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80';
            const displayImg = booking.destination_image || booking.destination?.hero_image || booking.package?.image_url || fallbackImage;
            const pnr = booking.pnr_code || `VG-${booking.id.substring(0, 8).toUpperCase()}`;

            return (
              <article
                key={booking.id}
                className={`group rounded-3xl overflow-hidden glass-panel glass-panel-hover flex flex-col justify-between border transition-all duration-300 relative ${
                  isCancelled ? 'opacity-75 border-rose-500/20' : 'border-white/15'
                }`}
              >
                {/* Top Subtle Light Reflection Highlight */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

                {/* Destination Hero Image Viewport */}
                <div className="relative h-56 sm:h-60 w-full overflow-hidden">
                  <img
                    src={displayImg}
                    alt={booking.destination_name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/35 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1.5 ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isCancelled
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-400 animate-pulse' : isCancelled ? 'bg-rose-400' : 'bg-amber-400'}`} />
                      {booking.status.toUpperCase()}
                    </span>

                    {/* Booking ID / PNR Code Pill */}
                    <button
                      onClick={() => handleCopyPnr(pnr)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md border border-white/20 text-surface-200 hover:text-white flex items-center gap-1.5 transition-colors"
                      title="Click to copy Booking ID"
                    >
                      <span>{pnr}</span>
                      {copiedId === pnr ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-60" />
                      )}
                    </button>
                  </div>

                  {/* Bottom Location Tag */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white z-10">
                    <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-[11px]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{booking.destination_location || 'Global Sanctuary'}</span>
                    </div>

                    {booking.tier && (
                      <span className="text-[10px] text-gold font-bold uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded-md border border-gold/30">
                        {booking.tier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body & Dynamic Details */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-5 relative z-10">
                  <div className="space-y-3">
                    <h3 className="font-display font-black text-xl text-white group-hover:text-primary transition-colors tracking-tight">
                      {booking.destination_name}
                    </h3>

                    {/* Specification Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-surface-300 pt-1">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-surface-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          Travel Date
                        </span>
                        <p className="text-white font-semibold">
                          {booking.travel_date ? formatDate(booking.travel_date) : 'Scheduled'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-surface-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-primary" />
                          Guests
                        </span>
                        <p className="text-white font-semibold">
                          {booking.guests || booking.travelers || 1} {Number(booking.guests || booking.travelers) === 1 ? 'Guest' : 'Guests'}
                        </p>
                      </div>
                    </div>

                    {/* Booking Date & Price Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-surface-400 block">
                          Booked On
                        </span>
                        <span className="text-surface-300">
                          {booking.booking_date ? formatDate(booking.booking_date) : formatDate(booking.created_at)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-surface-400 block">
                          Total Investment
                        </span>
                        <span className="font-display font-extrabold text-base text-gold">
                          {formatCurrency(booking.total_price || booking.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 justify-center shadow-sm"
                      onClick={() => setSelectedBooking(booking)}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      View Details
                    </Button>

                    {isConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingToCancel(booking)}
                        className="text-surface-400 hover:text-rose-400 hover:border-rose-500/40 text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          BOOKING DETAILS MODAL (Digital Dossier & Pass)
         ------------------------------------------------------------- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-modal-overlay animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl rounded-3xl glass-boarding-pass p-5 sm:p-8 border border-white/20 shadow-2xl overflow-y-auto max-h-[92vh] space-y-6">
            
            {/* Ambient Radial Glow */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedBooking(null)}
              className="print-hide absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/15 flex items-center justify-center text-surface-300 hover:text-white transition-all z-30"
              aria-label="Close dossier modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Trip Dossier & Digital Pass
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                {selectedBooking.destination_name}
              </h2>
              <p className="text-xs text-surface-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{selectedBooking.destination_location || 'Global Sanctuary'}</span>
                <span>&bull;</span>
                <span className={`font-semibold uppercase ${
                  selectedBooking.status === 'confirmed' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedBooking.status}
                </span>
              </p>
            </div>

            {/* Digital Pass Presentation */}
            <div className="rounded-3xl p-6 sm:p-7 border border-white/20 bg-black/60 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
              
              {/* Pass Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-dashed border-white/20 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center font-display font-black text-white text-xl">
                    V
                  </div>
                  <div>
                    <span className="font-display font-extrabold text-base sm:text-lg text-white tracking-widest block">
                      VOYAGE BESPOKE PASS
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                      Tier: {selectedBooking.tier || 'Comfort Sanctuary'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white/[0.06] border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-surface-400">PNR</span>
                    <span className="font-mono font-extrabold text-sm text-primary tracking-wider">
                      {selectedBooking.pnr_code || `VG-${selectedBooking.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyPnr(selectedBooking.pnr_code || selectedBooking.id)}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 text-surface-300 hover:text-white transition-colors"
                    title="Copy PNR code"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Destination & Flight graphic */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Origin</span>
                  <span className="font-display font-bold text-base text-white">VIP Concierge</span>
                  <span className="text-xs text-surface-400 block">Private Dispatch</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-full flex items-center justify-center gap-2 text-primary">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/60" />
                    <Plane className="w-4 h-4 text-gold transform rotate-90" />
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/60" />
                  </div>
                  <span className="text-[10px] font-bold text-surface-400 mt-1 uppercase tracking-wider">
                    Confirmed Sanctuary
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Sanctuary</span>
                  <span className="font-display font-bold text-base text-white">{selectedBooking.destination_name}</span>
                  <span className="text-xs text-primary font-semibold block">{selectedBooking.destination_location || 'Global'}</span>
                </div>
              </div>

              {/* Specifications Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Travel Date</span>
                  <span className="font-bold text-white">{formatDate(selectedBooking.travel_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Party Size</span>
                  <span className="font-bold text-white">{selectedBooking.guests || selectedBooking.travelers || 1} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Booked On</span>
                  <span className="font-bold text-white">{formatDate(selectedBooking.booking_date || selectedBooking.created_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">Total Investment</span>
                  <span className="font-bold text-gold">{formatCurrency(selectedBooking.total_price || selectedBooking.total_amount)}</span>
                </div>
              </div>

              {/* Contact info & special requests */}
              {(selectedBooking.contact_email || selectedBooking.special_requests) && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  {selectedBooking.contact_email && (
                    <div className="flex justify-between text-surface-300">
                      <span className="text-surface-400">Dispatch Email:</span>
                      <span className="font-medium text-white">{selectedBooking.contact_email}</span>
                    </div>
                  )}
                  {selectedBooking.contact_phone && (
                    <div className="flex justify-between text-surface-300">
                      <span className="text-surface-400">Concierge Phone:</span>
                      <span className="font-medium text-white">{selectedBooking.contact_phone}</span>
                    </div>
                  )}
                  {selectedBooking.special_requests && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-surface-400 block mb-1">Special Concierge Requests:</span>
                      <p className="text-surface-200 italic">{selectedBooking.special_requests}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Perforated QR Section */}
              <div className="pt-4 border-t border-dashed border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider block">
                      Verification Token
                    </span>
                    <span className="font-mono text-[11px] text-white">
                      {selectedBooking.pnr_code || selectedBooking.id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-surface-400 block font-semibold">Ledger Status</span>
                  <span className={`text-xs font-bold flex items-center gap-1 sm:justify-end ${
                    selectedBooking.status === 'confirmed' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {selectedBooking.status === 'confirmed' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed / On Account
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> Cancelled in History
                      </>
                    )}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="print-hide flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => window.print()}
                icon={<Printer className="w-4 h-4 text-primary" />}
                className="w-full sm:w-auto flex-1 justify-center"
              >
                Print / Save Pass
              </Button>

              {selectedBooking.status === 'confirmed' && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setBookingToCancel(selectedBooking);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel Booking
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedBooking(null)}
                className="w-full sm:w-auto flex-1 justify-center"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to My Trips
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CANCELLATION CONFIRMATION DIALOG
         ------------------------------------------------------------- */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal-overlay animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display font-black text-xl text-white">
                Cancel Trip Reservation?
              </h3>
              <p className="text-xs text-surface-300 leading-relaxed">
                Are you sure you want to cancel your journey to <strong>{bookingToCancel.destination_name}</strong>?
              </p>
              <p className="text-[11px] text-surface-400">
                Your reservation status will be updated to "cancelled" in Supabase and retained in your travel history.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancelling}
                className="flex-1 justify-center"
              >
                Keep Reservation
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                disabled={isCancelling}
                className="flex-1 justify-center"
              >
                Yes, Cancel Trip
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
