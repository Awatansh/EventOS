import { useAuthStore } from '../store/authStore';

/**
 * Custom hook wrapping the Zustand auth store.
 * Exposes convenience properties and methods.
 */
export function useAuth() {
  const { user, accessToken, isAuthenticated, login, logout, setAccessToken } = useAuthStore();

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    setAccessToken,
  };
}
