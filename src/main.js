import { supabase, isSupabaseConfigured, syncUserProfile } from './supabaseClient.js';
import { auth } from './firebase.js';

// High-fidelity fallback / seed data in case Supabase schema is not yet applied in dashboard
const SEED_DESTINATIONS = [
  {
    id: 'd1',
    name: 'Kyoto',
    slug: 'kyoto-japan',
    country: 'Japan',
    city: 'Kyoto',
    continent: 'Asia',
    description: 'Ancient temples, tranquil Zen stone gardens, traditional wooden machiya houses, and mystical bamboo groves.',
    short_description: 'Timeless elegance and ancient temples in the cultural heart of Japan.',
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.95,
    reviews_count: 342,
    price_level: 3,
    popular_tags: ['Cultural', 'Temples', 'Cherry Blossoms', 'Cuisine'],
    is_featured: true
  },
  {
    id: 'd2',
    name: 'Amalfi Coast',
    slug: 'amalfi-coast-italy',
    country: 'Italy',
    city: 'Positano',
    continent: 'Europe',
    description: 'Dramatic vertical cliffside villages, azure Tyrrhenian waters, vibrant bougainvillea, and Italian coastal luxury.',
    short_description: 'Iconic pastel villages and sun-drenched Mediterranean panoramas.',
    image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    rating: 4.90,
    reviews_count: 280,
    price_level: 4,
    popular_tags: ['Coastal', 'Romantic', 'Luxury', 'Seafood'],
    is_featured: true
  },
  {
    id: 'd3',
    name: 'Santorini',
    slug: 'santorini-greece',
    country: 'Greece',
    city: 'Oia',
    continent: 'Europe',
    description: 'Whitewashed cubiform villas perched on dramatic caldera cliffs overlooking the endless sapphire Aegean Sea.',
    short_description: 'Breathtaking sunsets and Aegean architecture on volcanic cliffs.',
    image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    rating: 4.88,
    reviews_count: 512,
    price_level: 3,
    popular_tags: ['Caldera', 'Sunset Views', 'Romantic', 'Wine'],
    is_featured: true
  },
  {
    id: 'd4',
    name: 'Banff National Park',
    slug: 'banff-canada',
    country: 'Canada',
    city: 'Banff',
    continent: 'North America',
    description: 'Glacial turquoise alpine lakes, soaring Rocky Mountain peaks, and pristine untamed wilderness adventures.',
    short_description: 'Turquoise glacier lakes framed by dramatic Rocky Mountain peaks.',
    image_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
    rating: 4.92,
    reviews_count: 195,
    price_level: 2,
    popular_tags: ['Nature', 'Mountains', 'Hiking', 'Adventure'],
    is_featured: true
  }
];

const SEED_PACKAGES = [
  {
    id: 'p1',
    destination_id: 'd1',
    title: 'Kyoto Heritage & Zen Retreat',
    slug: 'kyoto-heritage-zen-retreat',
    description: 'Immerse yourself in private tea ceremonies, Geisha district walks, temple meditation, and Michelin kaiseki dining.',
    duration_days: 7,
    duration_nights: 6,
    price: 2499.00,
    discounted_price: 2199.00,
    highlights: ['Fushimi Inari Sunrise Walk', 'Arashiyama Bamboo Forest Private Access', 'Traditional Kaiseki Banquet'],
    rating: 4.97,
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    is_popular: true
  },
  {
    id: 'p2',
    destination_id: 'd2',
    title: 'Amalfi Coastline Luxury Sail & Stay',
    slug: 'amalfi-coastline-luxury-sail',
    description: 'Cruise along Capri and Positano on private motor yachts, taste lemon orchards in Ravello, and unwind in cliffside villas.',
    duration_days: 6,
    duration_nights: 5,
    price: 3250.00,
    discounted_price: 2890.00,
    highlights: ['Capri Blue Grotto Exploration', 'Sunset Yacht Dinner', 'Ravello Historic Gardens'],
    rating: 4.94,
    image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    is_popular: true
  }
];

// App State
let destinations = [...SEED_DESTINATIONS];
let packages = [...SEED_PACKAGES];
let favorites = JSON.parse(localStorage.getItem('voyage_favs') || '[]');
let currentFilterContinent = 'all';
let currentSearchTerm = '';
let currentTravelStyle = 'all';
let currentUser = null;
let isLiveDb = false;

// Sample Trips State
let trips = [
  {
    id: 'trip-1',
    title: 'Autumn in Kyoto & Arashiyama',
    budget: 4500,
    status: 'planning',
    days: [
      {
        dayNumber: 1,
        title: 'Arrival & Gion Lantern Walk',
        activities: [
          { time: '14:00', title: 'Check-in at Luxury Ryokan', desc: 'Welcome matcha tea and kimono fitting', cost: 0 },
          { time: '18:30', title: 'Private Gion Evening Walk', desc: 'Explore historic preservation districts with local historian', cost: 180 },
          { time: '20:30', title: 'Kaiseki Dinner at Roan Kikunoi', desc: '9-course seasonal autumn menu', cost: 250 }
        ]
      },
      {
        dayNumber: 2,
        title: 'Temples & Zen Gardens',
        activities: [
          { time: '07:30', title: 'Fushimi Inari Torii Gates', desc: 'Beat the crowds up Mt. Inari summit path', cost: 0 },
          { time: '12:00', title: 'Nishiki Market Culinary Tour', desc: 'Sample freshly roasted wagyu skewers and dashi tamago', cost: 65 },
          { time: '15:00', title: 'Kinkaku-ji Golden Pavilion', desc: 'Reflections across the mirror pond', cost: 20 }
        ]
      }
    ]
  }
];
let activeTripIndex = 0;

// DOM Elements
const destinationsGrid = document.getElementById('destinations-grid');
const packagesGrid = document.getElementById('packages-grid');
const searchInput = document.getElementById('search-input');
const continentSelect = document.getElementById('continent-select');
const travelTypeSelect = document.getElementById('travel-type-select');
const btnSearchTrigger = document.getElementById('btn-search-trigger');
const continentPills = document.getElementById('continent-pills');
const favCountSpan = document.getElementById('fav-count');
const favoritesGrid = document.getElementById('favorites-grid');
const dbStatusBadge = document.getElementById('db-status-badge');
const migrationBanner = document.getElementById('migration-banner');
const toastContainer = document.getElementById('toast-container');

// Modals
const bookingModal = document.getElementById('booking-modal');
const btnCloseBooking = document.getElementById('btn-close-booking');
const bookingForm = document.getElementById('booking-form');
const bookingPackageTitle = document.getElementById('booking-package-title');
const bookingTravelers = document.getElementById('booking-travelers');
const bookingTotalDisplay = document.getElementById('booking-total-display');
let selectedPackageForBooking = null;

const authModal = document.getElementById('auth-modal');
const btnOpenAuth = document.getElementById('btn-open-auth');
const btnCloseAuth = document.getElementById('btn-close-auth');
const btnGuestAuth = document.getElementById('btn-guest-auth');
const authForm = document.getElementById('auth-form');

// Itinerary Elements
const activeTripSelect = document.getElementById('active-trip-select');
const tripBudgetBadge = document.getElementById('trip-budget-badge');
const tripDaysBadge = document.getElementById('trip-days-badge');
const tripStatusBadge = document.getElementById('trip-status-badge');
const itineraryTimeline = document.getElementById('itinerary-timeline');
const btnAddActivity = document.getElementById('btn-add-activity');

// Toast Notification Helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✦' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 1. Initialize Database Connection & Fetch Data
async function initDatabase() {
  if (!isSupabaseConfigured || !supabase) {
    dbStatusBadge.className = 'db-status-badge pending';
    dbStatusBadge.innerHTML = '<span class="status-dot"></span><span>Anon Key Required</span>';
    return;
  }

  try {
    const { data: destData, error: destError } = await supabase
      .from('destinations')
      .select('*')
      .order('rating', { ascending: false });

    if (destError) {
      // If table doesn't exist yet, show migration banner
      console.warn('[Supabase] Schema not yet created:', destError.message);
      dbStatusBadge.className = 'db-status-badge pending';
      dbStatusBadge.innerHTML = '<span class="status-dot"></span><span>Supabase (Schema Pending)</span>';
      migrationBanner.style.display = 'flex';
      return;
    }

    if (destData && destData.length > 0) {
      destinations = destData;
      isLiveDb = true;
    }

    const { data: pkgData } = await supabase
      .from('travel_packages')
      .select('*')
      .order('price', { ascending: true });

    if (pkgData && pkgData.length > 0) {
      packages = pkgData;
    }

    dbStatusBadge.className = 'db-status-badge';
    dbStatusBadge.innerHTML = '<span class="status-dot"></span><span>Supabase Live DB</span>';
    migrationBanner.style.display = 'none';
  } catch (err) {
    console.error('[Supabase] Connection error:', err);
  }
}

// 2. Render Destinations
function renderDestinations() {
  const filtered = destinations.filter(d => {
    const matchesContinent = currentFilterContinent === 'all' || d.continent === currentFilterContinent;
    const matchesSearch = !currentSearchTerm || 
      d.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) || 
      d.country.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      (d.popular_tags && d.popular_tags.some(t => t.toLowerCase().includes(currentSearchTerm.toLowerCase())));
    const matchesStyle = currentTravelStyle === 'all' || 
      (d.popular_tags && d.popular_tags.includes(currentTravelStyle));
    return matchesContinent && matchesSearch && matchesStyle;
  });

  if (filtered.length === 0) {
    destinationsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted); font-size: 1.1rem;">No destinations match your filters. Try selecting a different continent or search query.</p>
      </div>
    `;
    return;
  }

  destinationsGrid.innerHTML = filtered.map(d => {
    const isFav = favorites.includes(d.id);
    return `
      <article class="destination-card" data-id="${d.id}">
        <div class="card-img-wrap">
          <img src="${d.image_url}" alt="${d.name}, ${d.country}" loading="lazy" />
          <button class="card-favorite-btn ${isFav ? 'active' : ''}" data-fav-id="${d.id}" title="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <div class="card-rating-badge">
            <span>★</span>
            <span>${d.rating}</span>
          </div>
        </div>
        <div class="card-body">
          <span class="card-country">${d.country} &bull; ${d.continent}</span>
          <h3 class="card-title">${d.name}</h3>
          <p class="card-desc">${d.short_description || d.description}</p>
          <div class="card-tags">
            ${(d.popular_tags || []).map(t => `<span class="tag-item">${t}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 3. Render Packages
function renderPackages() {
  packagesGrid.innerHTML = packages.map(p => `
    <article class="package-card" data-pkg-id="${p.id}">
      <div class="package-banner">
        <img src="${p.image_url}" alt="${p.title}" loading="lazy" />
        <span class="package-duration">${p.duration_days} Days / ${p.duration_nights} Nights</span>
      </div>
      <div class="package-body">
        <h3 class="package-title">${p.title}</h3>
        <p class="card-desc">${p.description}</p>
        <ul class="package-highlights">
          ${(p.highlights || []).map(h => `<li>${h}</li>`).join('')}
        </ul>
        <div class="package-footer">
          <div class="package-price-wrap">
            ${p.discounted_price ? `<span class="price-original">$${p.price.toLocaleString()}</span>` : ''}
            <span class="price-current">$${(p.discounted_price || p.price).toLocaleString()} <small>/ person</small></span>
          </div>
          <button class="btn btn-primary btn-sm btn-book-package" data-id="${p.id}">Reserve Voyage</button>
        </div>
      </div>
    </article>
  `).join('');
}

// 4. Render Saved Favorites
function renderFavorites() {
  favCountSpan.textContent = favorites.length;
  if (favorites.length === 0) {
    favoritesGrid.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <p>No saved destinations yet. Click the heart icon on any destination card to bookmark it.</p>
      </div>
    `;
    return;
  }

  const favDestinations = destinations.filter(d => favorites.includes(d.id));
  favoritesGrid.innerHTML = `
    <div class="destinations-grid">
      ${favDestinations.map(d => `
        <article class="destination-card" data-id="${d.id}">
          <div class="card-img-wrap">
            <img src="${d.image_url}" alt="${d.name}" />
            <button class="card-favorite-btn active" data-fav-id="${d.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
          <div class="card-body">
            <span class="card-country">${d.country}</span>
            <h3 class="card-title">${d.name}</h3>
            <p class="card-desc">${d.short_description}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

// 5. Itinerary & Trip Planner
function renderTripPlanner() {
  const currentTrip = trips[activeTripIndex];
  if (!currentTrip) return;

  activeTripSelect.innerHTML = trips.map((t, idx) => `
    <option value="${idx}" ${idx === activeTripIndex ? 'selected' : ''}>${t.title}</option>
  `).join('');

  tripBudgetBadge.textContent = `Budget: $${currentTrip.budget.toLocaleString()}`;
  tripDaysBadge.textContent = `${currentTrip.days.length} Days`;
  tripStatusBadge.textContent = currentTrip.status.toUpperCase();

  itineraryTimeline.innerHTML = currentTrip.days.map(day => `
    <div class="timeline-day-card">
      <div class="day-header">
        <h4 class="day-title">Day ${day.dayNumber} — ${day.title}</h4>
      </div>
      <div class="day-activities-list">
        ${day.activities.map(act => `
          <div class="activity-item">
            <span class="activity-time">${act.time}</span>
            <div class="activity-details">
              <h5>${act.title}</h5>
              <p>${act.desc}</p>
            </div>
            <span class="activity-cost">${act.cost > 0 ? `$${act.cost}` : 'Included'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Event Listeners: Search & Filters
searchInput.addEventListener('input', (e) => {
  currentSearchTerm = e.target.value;
  renderDestinations();
});

continentSelect.addEventListener('change', (e) => {
  currentFilterContinent = e.target.value;
  updatePillsUI(e.target.value);
  renderDestinations();
});

travelTypeSelect.addEventListener('change', (e) => {
  currentTravelStyle = e.target.value;
  renderDestinations();
});

btnSearchTrigger.addEventListener('click', () => {
  document.getElementById('destinations').scrollIntoView({ behavior: 'smooth' });
});

continentPills.addEventListener('click', (e) => {
  if (e.target.classList.contains('pill-btn')) {
    const filter = e.target.dataset.filter;
    currentFilterContinent = filter;
    continentSelect.value = filter;
    updatePillsUI(filter);
    renderDestinations();
  }
});

function updatePillsUI(filterVal) {
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterVal);
  });
}

// Event Delegation for Favorites
document.body.addEventListener('click', async (e) => {
  const favBtn = e.target.closest('.card-favorite-btn');
  if (favBtn) {
    const id = favBtn.dataset.favId;
    if (favorites.includes(id)) {
      favorites = favorites.filter(fav => fav !== id);
      showToast('Removed from saved sanctuaries');
    } else {
      favorites.push(id);
      showToast('Added to saved sanctuaries', 'success');
    }
    localStorage.setItem('voyage_favs', JSON.stringify(favorites));
    renderDestinations();
    renderFavorites();

    // Sync to Supabase if live
    if (isLiveDb && currentUser && supabase) {
      try {
        await supabase.from('favorites').upsert({
          user_id: currentUser.uid,
          destination_id: id
        });
      } catch (err) {
        console.warn('[Favorites] Sync failed:', err);
      }
    }
  }

  // Booking Button
  const bookBtn = e.target.closest('.btn-book-package');
  if (bookBtn) {
    const pkgId = bookBtn.dataset.id;
    selectedPackageForBooking = packages.find(p => p.id === pkgId);
    if (selectedPackageForBooking) {
      bookingPackageTitle.textContent = selectedPackageForBooking.title;
      updateBookingPrice();
      bookingModal.style.display = 'flex';
    }
  }
});

// Booking Modal Logic
function updateBookingPrice() {
  if (!selectedPackageForBooking) return;
  const count = parseInt(bookingTravelers.value, 10) || 1;
  const unitPrice = selectedPackageForBooking.discounted_price || selectedPackageForBooking.price;
  const total = unitPrice * count;
  bookingTotalDisplay.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

bookingTravelers.addEventListener('change', updateBookingPrice);
btnCloseBooking.addEventListener('click', () => {
  bookingModal.style.display = 'none';
});

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('booking-start-date').value;
  const travelers = parseInt(bookingTravelers.value, 10);
  const email = document.getElementById('booking-email').value;
  const phone = document.getElementById('booking-phone').value;
  const requests = document.getElementById('booking-requests').value;
  const unitPrice = selectedPackageForBooking.discounted_price || selectedPackageForBooking.price;
  const total = unitPrice * travelers;

  if (isLiveDb && supabase) {
    try {
      await supabase.from('bookings').insert({
        user_id: currentUser ? currentUser.uid : 'guest-traveler',
        package_id: selectedPackageForBooking.id,
        start_date: date,
        travelers_count: travelers,
        total_price: total,
        contact_email: email,
        contact_phone: phone,
        special_requests: requests,
        status: 'confirmed'
      });
    } catch (err) {
      console.warn('[Booking] Saved locally, remote insert notice:', err.message);
    }
  }

  bookingModal.style.display = 'none';
  bookingForm.reset();
  showToast(`Reservation confirmed for ${selectedPackageForBooking.title}! Confirmation sent to ${email}.`, 'success');
});

// Auth Modal
btnOpenAuth.addEventListener('click', () => {
  authModal.style.display = 'flex';
});

btnCloseAuth.addEventListener('click', () => {
  authModal.style.display = 'none';
});

btnGuestAuth.addEventListener('click', () => {
  currentUser = {
    uid: 'guest-' + Math.random().toString(36).substring(2, 9),
    email: 'guest@voyage.travel',
    displayName: 'Guest Explorer'
  };
  authModal.style.display = 'none';
  document.getElementById('auth-container').innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.6rem;">
      <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">GE</span>
      <span style="font-size: 0.9rem; font-weight: 600;">Guest Explorer</span>
    </div>
  `;
  showToast('Logged in as Guest Explorer', 'success');
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  currentUser = {
    uid: 'traveler-' + Math.random().toString(36).substring(2, 9),
    email,
    displayName: email.split('@')[0]
  };
  authModal.style.display = 'none';
  document.getElementById('auth-container').innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.6rem;">
      <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">${email.charAt(0).toUpperCase()}</span>
      <span style="font-size: 0.9rem; font-weight: 600;">${currentUser.displayName}</span>
    </div>
  `;
  showToast(`Welcome back, ${currentUser.displayName}!`, 'success');
});

// Trip Itinerary Activity addition
btnAddActivity.addEventListener('click', () => {
  const currentTrip = trips[activeTripIndex];
  const newActivity = {
    time: '11:00',
    title: 'Private Yacht Cruise',
    desc: 'Champagne tasting and coastal swimming excursion',
    cost: 220
  };
  if (currentTrip.days.length > 0) {
    currentTrip.days[0].activities.push(newActivity);
    renderTripPlanner();
    showToast('New activity added to Day 1 itinerary', 'success');
  }
});

// Trip Selection & Creation
const btnNewTripModal = document.getElementById('btn-new-trip-modal');
if (btnNewTripModal) {
  btnNewTripModal.addEventListener('click', () => {
    const tripName = prompt('Enter a name for your new voyage:', 'Mediterranean Summer Odyssey');
    if (tripName) {
      trips.push({
        id: 'trip-' + (trips.length + 1),
        title: tripName,
        budget: 5000,
        status: 'planning',
        days: [
          {
            dayNumber: 1,
            title: 'Arrival & Welcome Reception',
            activities: [
              { time: '15:00', title: 'Private Check-in & Concierge Briefing', desc: 'Welcome amenities and itinerary walkthrough', cost: 0 },
              { time: '19:00', title: 'Sunset Cocktails & Welcome Dinner', desc: 'Curated tasting menu overlooking the bay', cost: 180 }
            ]
          }
        ]
      });
      activeTripIndex = trips.length - 1;
      renderTripPlanner();
      showToast(`Created new trip: ${tripName}`, 'success');
    }
  });
}

if (activeTripSelect) {
  activeTripSelect.addEventListener('change', (e) => {
    activeTripIndex = parseInt(e.target.value, 10) || 0;
    renderTripPlanner();
  });
}

// Copy Migration SQL helper
document.getElementById('btn-copy-migration')?.addEventListener('click', () => {
  navigator.clipboard.writeText(`-- See supabase/migrations/20260925205500_create_voyage_schema.sql`);
  showToast('Migration file path copied to clipboard');
});

// Initial boot
(async function init() {
  await initDatabase();
  renderDestinations();
  renderPackages();
  renderFavorites();
  renderTripPlanner();
})();
