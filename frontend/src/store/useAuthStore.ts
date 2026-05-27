import { create } from 'zustand';
import { authService } from '../services/api';

export type User = {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'admin' | 'kasir';
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('authUser');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      set({
        token: data.accessToken,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login gagal, periksa koneksi Anda.';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
