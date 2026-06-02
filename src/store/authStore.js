import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (token) localStorage.setItem('token', token);
        set({ token, user });
      },
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'terratrace-auth-storage', // key in localStorage
    }
  )
);
