import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Route guard that redirects to /login if user is not authenticated.
 * Optionally requires admin role.
 */
export const ProtectedRoute: React.FC<Props> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};
