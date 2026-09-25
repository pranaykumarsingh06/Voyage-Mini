# VOYAGE — Luxury Travel Discovery & Trip Planning Platform

VOYAGE is an award-winning, production-grade travel-tech platform combining editorial aesthetics with a cinematic frontend, persistent PostgreSQL database via Supabase, Firebase Authentication, interactive multi-day trip planning, and a privileged operations admin dashboard.

---

## ✦ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React, React Router v6.
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) & PostgREST.
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth) with Supabase RLS JWT bridge.
- **Admin Server**: Node.js / Express API with server-side privilege validation.

---

## ✦ Features

1. **Cinematic Landing Page**:
   - Full-screen imagery with glassmorphic search console.
   - Featured destinations with ratings, pricing, and live bookmarking.
   - Signature categorization tiles (Cultural, Luxury, Beaches, Mountains, Wildlife, Adventure).
   - Trending expeditions and editorial dispatch newsletter.

2. **Destination Discovery (`/explore`)**:
   - Real-time search by keyword, city, country, or sanctuary name.
   - Filter by country, experience category, and budget range slider.
   - Sort by rating, budget, or name with Grid and List view modes.

3. **Sanctuary Details (`/destinations/:slug`)**:
   - Multi-photo image gallery with thumbnail navigation.
   - Curator intelligence: optimal season, recommended stay duration, estimated budget.
   - Linked travel packages and related sanctuary recommendations.

4. **Curated Expeditions & Booking (`/packages`)**:
   - Package inclusions, exclusions, and multi-day highlights.
   - Instant reservation modal with dynamic total calculation by party size.
   - Honest booking workflow stored directly in Supabase `bookings`.

5. **Bespoke Trip Planner (`/planner`)**:
   - Create custom voyages with start/end dates, guest count, and investment budget.
   - Day-by-day activity timelines with time slots, sanctuary locations, and curator notes.
   - Real-time excursion scheduling and trip management.

6. **Traveler Sanctuary & Dashboard (`/dashboard`)**:
   - Overview metrics: active voyages, bookmarked sanctuaries, logged bookings.
   - Dedicated tabs for My Trips, Saved Sanctuaries, and Reservations.

7. **Privileged Operations Admin Console (`/admin`)**:
   - Executive metrics: total users, sanctuaries, packages, and bookings.
   - Destination management: Add, edit, publish/draft, and delete sanctuaries.
   - Booking management: Review customer reservations and update statuses (`pending`, `confirmed`, `cancelled`, `completed`).
   - Registered passport holders directory and immutable activity logs.

---

## ✦ Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ntoayhpdqpvaylndeyyx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Authentication Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Apply Supabase Database Migration
Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/ntoayhpdqpvaylndeyyx/sql/new), copy the SQL from:
`supabase/migrations/20260926000000_voyage_complete_schema.sql`
and click **Run**.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 5. Test Database Connection
```bash
npm run test:db
```

---

## ✦ Secure Initial Admin Creation

To establish the first administrator without public self-promotion:
```bash
node server/scripts/create-admin.mjs <user_email_or_firebase_uid>
```
Example:
```bash
node server/scripts/create-admin.mjs admin@voyage.luxury
```
This updates the user's role to `'admin'` directly in PostgreSQL using privileged credentials.

---

## ✦ Deployment Guide

- **Frontend (Vercel / Netlify / Cloudflare Pages)**:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variables: add all `VITE_*` variables in dashboard.
- **Backend**:
  - Deploy `server/index.js` to Render, Railway, or Google Cloud Run.