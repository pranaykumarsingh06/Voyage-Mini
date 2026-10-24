import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  MapPin, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Activity,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, ADMIN_EMAIL } from '../../contexts/AuthContext';
import { useDestinations } from '../../hooks/useDestinations';
import { usePackages } from '../../hooks/usePackages';
import { useBookings } from '../../hooks/useBookings';
import { INITIAL_PROFILES } from '../../lib/mockData';
import { Destination, TravelPackage, BookingStatus, Profile } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/common/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const AdminDashboardPage: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const { destinations } = useDestinations();
  const { packages } = usePackages();
  const { bookings, updateBookingStatus } = useBookings();

  // Admin section tabs
  const [currentSection, setCurrentSection] = useState<
    'overview' | 'destinations' | 'packages' | 'bookings' | 'users' | 'logs'
  >('overview');

  // Destinations Management state
  const [destList, setDestList] = useState<Destination[]>(destinations);
  const [destModalOpen, setDestModalOpen] = useState(false);
  const [newDestName, setNewDestName] = useState('');
  const [newDestCountry, setNewDestCountry] = useState('');
  const [newDestCategory, setNewDestCategory] = useState<any>('Luxury');
  const [newDestBudget, setNewDestBudget] = useState(3000);
  const [newDestImage, setNewDestImage] = useState('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80');
  const [newDestDesc, setNewDestDesc] = useState('');

  // Packages Management state
  const [pkgList, setPkgList] = useState<TravelPackage[]>(packages);

  // Users state with live database loading
  const [usersList, setUsersList] = useState<Profile[]>(INITIAL_PROFILES);
  const [userSearch, setUserSearch] = useState('');

  React.useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.from('profiles').select('*').then(({ data, error }: { data: any; error: any }) => {
        if (!error && data && data.length > 0) {
          setUsersList(data as Profile[]);
        }
      });
    }
  }, []);

  // Activity logs
  const [logs] = useState([
    { id: '1', action: 'Published destination "Kyoto Heritage"', time: '10 minutes ago', admin: 'pranaykrsingh03@gmail.com' },
    { id: '2', action: 'Confirmed reservation for Julian Vance', time: '1 hour ago', admin: 'pranaykrsingh03@gmail.com' },
    { id: '3', action: 'Updated package pricing for Amalfi Coast Sail', time: '3 hours ago', admin: 'pranaykrsingh03@gmail.com' },
  ]);

  const handleTogglePublishDest = async (id: string) => {
    const target = destList.find(d => d.id === id);
    if (!target) return;
    const nextState = !target.is_published;
    setDestList(destList.map(d => d.id === id ? { ...d, is_published: nextState } : d));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('destinations').update({ is_published: nextState }).eq('id', id);
      } catch (err) {
        console.warn('[Admin] Destination update error:', err);
      }
    }
  };

  const handleDeleteDest = async (id: string) => {
    setDestList(destList.filter(d => d.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('destinations').delete().eq('id', id);
      } catch (err) {
        console.warn('[Admin] Destination delete error:', err);
      }
    }
  };

  const handleCreateDest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName || !newDestCountry) return;

    const created: Destination = {
      id: 'dest-' + Math.random().toString(36).substring(2, 9),
      name: newDestName,
      slug: newDestName.toLowerCase().replace(/\s+/g, '-'),
      country: newDestCountry,
      description: newDestDesc || 'Bespoke destination sanctuary.',
      hero_image: newDestImage,
      gallery_images: [newDestImage],
      category: newDestCategory,
      estimated_budget: newDestBudget,
      recommended_duration: '6 Days',
      best_time_to_visit: 'Spring & Autumn',
      rating: 4.95,
      is_featured: false,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDestList([created, ...destList]);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('destinations').insert({
          name: created.name,
          slug: created.slug,
          country: created.country,
          description: created.description,
          hero_image: created.hero_image,
          category: created.category,
          estimated_budget: created.estimated_budget,
          rating: created.rating,
          is_published: true
        });
      } catch (err) {
        console.warn('[Admin] Destination insert error:', err);
      }
    }

    setDestModalOpen(false);
    setNewDestName('');
    setNewDestCountry('');
    setNewDestDesc('');
  };

  // If not verified admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-3xl text-white">Privileged Access Required</h2>
        <p className="text-xs text-surface-400 leading-relaxed">
          The Voyage Operations Control Panel is strictly restricted to platform administrator <strong className="text-gold">{ADMIN_EMAIL}</strong>.
        </p>

        <div className="pt-2 flex flex-col gap-2">
          <Link to="/auth/signin">
            <Button variant="primary" size="md" className="w-full">
              Sign In as Administrator
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full">
              Return to Website
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    !userSearch || 
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Top Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center text-white shadow-glow-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary">Master Console</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                Live Server RLS
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Voyage Operations Control
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-border-subtle text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-surface-300 font-mono text-xs">{profile?.email}</span>
            <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-primary/30">
              Verified Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-2 border-b border-border-subtle pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
          { id: 'destinations', label: `Destinations (${destList.length})`, icon: MapPin },
          { id: 'packages', label: `Packages (${pkgList.length})`, icon: Sparkles },
          { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Calendar },
          { id: 'users', label: `Users (${usersList.length})`, icon: Users },
          { id: 'logs', label: 'Activity Logs', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentSection(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              currentSection === tab.id
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: OVERVIEW */}
      {currentSection === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Total Sanctuaries</span>
              <p className="font-display font-black text-3xl text-white">{destList.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Curated Packages</span>
              <p className="font-display font-black text-3xl text-primary">{pkgList.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Logged Bookings</span>
              <p className="font-display font-black text-3xl text-gold">{bookings.length}</p>
            </div>
            <div className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-1">
              <span className="text-surface-400 text-xs font-semibold uppercase">Registered Travelers</span>
              <p className="font-display font-black text-3xl text-emerald-400">{usersList.length}</p>
            </div>
          </div>

          {/* Recent Booking Requests */}
          <div className="rounded-3xl glass-panel p-6 border border-border-subtle space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Recent Concierge Booking Dispatches</h3>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-semibold text-sm text-white">{b.package?.title || 'Bespoke Package'}</h4>
                    <p className="text-xs text-surface-400">
                      Traveler: {b.profile?.full_name || 'VIP Guest'} &bull; {b.travelers} Guests &bull; {b.travel_date ? formatDate(b.travel_date) : 'Scheduled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-white">{formatCurrency(b.total_amount)}</span>
                    <select
                      value={b.status}
                      onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                      className="bg-background-secondary border border-border-subtle text-xs rounded-xl px-2.5 py-1 text-white focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DESTINATIONS */}
      {currentSection === 'destinations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">Sanctuary Management</h3>
            <Button variant="primary" size="sm" onClick={() => setDestModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Sanctuary
            </Button>
          </div>

          <div className="rounded-3xl glass-panel overflow-hidden border border-border-subtle">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-white/[0.02] text-surface-400 uppercase font-semibold">
                  <th className="p-4">Sanctuary</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Est. Budget</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-surface-300">
                {destList.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white flex items-center gap-3">
                      <img src={d.hero_image} alt={d.name} className="w-9 h-9 rounded-xl object-cover" />
                      <span>{d.name}</span>
                    </td>
                    <td className="p-4">{d.country}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-white/[0.05]">{d.category}</span></td>
                    <td className="p-4 font-bold text-white">{formatCurrency(d.estimated_budget)}</td>
                    <td className="p-4 text-gold font-bold">★ {d.rating}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePublishDest(d.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          d.is_published ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-surface-500/20 text-surface-400'
                        }`}
                      >
                        {d.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteDest(d.id)}
                        className="p-1.5 text-surface-400 hover:text-rose-400 transition-colors"
                        title="Delete Sanctuary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: PACKAGES */}
      {currentSection === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">Curated Travel Packages</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pkgList.map((pkg) => (
              <div key={pkg.id} className="p-6 rounded-3xl glass-panel border border-border-subtle space-y-3">
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                  {pkg.duration_days} Days / {pkg.duration_days - 1} Nights
                </span>
                <h4 className="font-display font-bold text-lg text-white">{pkg.title}</h4>
                <p className="text-xs text-surface-400 line-clamp-2">{pkg.description}</p>
                <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                  <span className="font-display font-bold text-lg text-white">{formatCurrency(pkg.price_per_person)}</span>
                  <span className="text-xs text-emerald-400 font-semibold">Published</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: BOOKINGS */}
      {currentSection === 'bookings' && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl text-white">Concierge Booking Requests</h3>
          <div className="rounded-3xl glass-panel overflow-hidden border border-border-subtle">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-white/[0.02] text-surface-400 uppercase font-semibold">
                  <th className="p-4">Package</th>
                  <th className="p-4">Traveler</th>
                  <th className="p-4">Travel Date</th>
                  <th className="p-4">Party</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-surface-300">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white">{b.package?.title || 'Custom Sanctuary'}</td>
                    <td className="p-4">{b.profile?.full_name || 'Verified Guest'}</td>
                    <td className="p-4">{b.travel_date ? formatDate(b.travel_date) : 'Pending'}</td>
                    <td className="p-4">{b.travelers} Guests</td>
                    <td className="p-4 font-bold text-white">{formatCurrency(b.total_amount)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={b.status}
                        onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                        className="bg-background-secondary border border-border-subtle text-xs rounded-lg px-2 py-1 text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: USERS */}
      {currentSection === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <h3 className="font-display font-bold text-xl text-white">Registered Passport Holders</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search travelers..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="rounded-3xl glass-panel overflow-hidden border border-border-subtle">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-white/[0.02] text-surface-400 uppercase font-semibold">
                  <th className="p-4">Traveler</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Passport ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-surface-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white flex items-center gap-3">
                      <img src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <span>{u.full_name}</span>
                    </td>
                    <td className="p-4 text-surface-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/[0.05] text-surface-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-surface-500 font-mono text-[11px]">{u.firebase_uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: LOGS */}
      {currentSection === 'logs' && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl text-white">Immutable Administrative Logs</h3>
          <div className="rounded-3xl glass-panel p-6 border border-border-subtle space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-white font-medium">{log.action}</span>
                </div>
                <div className="flex items-center gap-4 text-surface-500">
                  <span>{log.admin}</span>
                  <span>&bull;</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Destination Modal */}
      {destModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong shadow-2xl">
            <h3 className="font-display font-bold text-2xl text-white mb-4">Add Global Sanctuary</h3>

            <form onSubmit={handleCreateDest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Sanctuary Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Positano Cliffside"
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Italy"
                    value={newDestCountry}
                    onChange={(e) => setNewDestCountry(e.target.value)}
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Category</label>
                  <select
                    value={newDestCategory}
                    onChange={(e: any) => setNewDestCategory(e.target.value)}
                    className="w-full bg-background-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Luxury">Luxury</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Beaches">Beaches</option>
                    <option value="Mountains">Mountains</option>
                    <option value="Wildlife">Wildlife</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Hero Image URL</label>
                <input
                  type="url"
                  value={newDestImage}
                  onChange={(e) => setNewDestImage(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Estimated Budget ($)</label>
                <input
                  type="number"
                  value={newDestBudget}
                  onChange={(e) => setNewDestBudget(Number(e.target.value))}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-surface-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDestDesc}
                  onChange={(e) => setNewDestDesc(e.target.value)}
                  placeholder="Curator commentary..."
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2 text-sm text-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" size="md" onClick={() => setDestModalOpen(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="w-1/2">
                  Save Sanctuary
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
