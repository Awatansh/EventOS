import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { authApi } from './api/auth.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/shared/Toast';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

import { ThemeProvider } from './contexts/ThemeContext';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEventForm } from './pages/AdminEventForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        
        {/* Protected User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <ProtectedRoute requireAdmin>
              <AdminEventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <ProtectedRoute requireAdmin>
              <AdminEventForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const { login, accessToken } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      // If we already have an accessToken, or we know we are authenticated, we can skip
      // However, after a Google OAuth redirect, isAuthenticated is false and accessToken is null
      // But we have an HttpOnly cookie! Let's try to silently refresh it.
      if (!accessToken) {
        try {
          const result = await authApi.refresh();
          // If successful, the refresh endpoint now returns both accessToken AND user
          login(result.user, result.accessToken);
        } catch (error) {
          // It's perfectly normal for this to fail if the user is truly not logged in.
          // The Axios interceptor might log it or the backend might return 401, we just swallow it.
        }
      }
      setIsInitializing(false);
    };

    initSession();
  }, [accessToken, login]);

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
