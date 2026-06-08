import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,           // ← true once localStorage is fully rehydrated
      setHasHydrated: (val) => set({ hasHydrated: val }),
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
      name: 'terratrace-auth-storage',
      onRehydrateStorage: () => (state) => {
        // Called when Zustand finishes reading from localStorage.
        // Mark hydration complete so auth guards don't fire prematurely.
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
