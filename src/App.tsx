import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { ExplorePage } from './pages/Explore/ExplorePage';
import { DestinationDetailsPage } from './pages/DestinationDetails/DestinationDetailsPage';
import { PackagesPage } from './pages/Packages/PackagesPage';
import { TripPlannerPage } from './pages/TripPlanner/TripPlannerPage';
import { UserDashboardPage } from './pages/Dashboard/UserDashboardPage';
import { UserProfilePage } from './pages/Profile/UserProfilePage';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { SignInPage } from './pages/Authentication/SignInPage';
import { SignUpPage } from './pages/Authentication/SignUpPage';
import { ForgotPasswordPage } from './pages/Authentication/ForgotPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="destinations" element={<ExplorePage />} />
              <Route path="destinations/:slug" element={<DestinationDetailsPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="planner" element={<TripPlannerPage />} />

              {/* Protected Traveler Routes */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Panel */}
              <Route path="admin" element={<AdminDashboardPage />} />

              {/* Authentication */}
              <Route path="auth/signin" element={<SignInPage />} />
              <Route path="auth/signup" element={<SignUpPage />} />
              <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
