import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
}

/**
 * Zustand auth store.
 * - User profile persisted to sessionStorage for page refresh survival.
 * - Access token ONLY in memory (not localStorage) to prevent XSS theft.
 */
export const useAuthStore = create<AuthState>((set) => {
  // Restore user from sessionStorage on init
  const storedUser = sessionStorage.getItem('eventos_user');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    accessToken: null,
    isAuthenticated: !!initialUser,

    login: (user: User, accessToken: string) => {
      sessionStorage.setItem('eventos_user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    },

    logout: () => {
      sessionStorage.removeItem('eventos_user');
      set({ user: null, accessToken: null, isAuthenticated: false });
    },

    setAccessToken: (token: string) => {
      set({ accessToken: token });
    },

    setUser: (user: User) => {
      sessionStorage.setItem('eventos_user', JSON.stringify(user));
      set({ user });
    },
  };
});
