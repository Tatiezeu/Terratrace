// BEHAVIOR: Manages global persistent authentication state (JWT token and user object) using Zustand.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// BEHAVIOR: Exports the useAuthStore hook to set/get/clear user session details in memory and localStorage
export const useAuthStore = create(
  persist(
    (set) => ({
      // BEHAVIOR: Stores the JWT authorization token string
      token: null,
      // BEHAVIOR: Stores user profile fields (id, email, role, etc.)
      user: null,
      // BEHAVIOR: Flag indicating whether Zustand has finished restoring state from localStorage on startup
      hasHydrated: false,           // ← true once localStorage is fully rehydrated
      // BEHAVIOR: Updates the hydration completion flag
      setHasHydrated: (val) => set({ hasHydrated: val }),
      // BEHAVIOR: Commits auth credentials (JWT and profile) to memory and persists JWT to localStorage
      setAuth: (token, user) => {
        if (token) localStorage.setItem('token', token);
        set({ token, user });
      },
      // BEHAVIOR: Revokes session credentials, clearing memory state and deleting token from localStorage
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      // BEHAVIOR: Updates active user profile values partially in state
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      // BEHAVIOR: Name of the key used inside localStorage for browser persistence
      name: 'terratrace-auth-storage',
      // BEHAVIOR: Lifecycle hook executing when storage rehydration completes on page refresh
      onRehydrateStorage: () => (state) => {
        // Called when Zustand finishes reading from localStorage.
        // Mark hydration complete so auth guards don't fire prematurely.
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
