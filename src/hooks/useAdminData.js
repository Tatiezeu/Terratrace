// BEHAVIOR: Custom hooks for Admin-specific data query and mutations, utilizing TanStack Query (@tanstack/react-query).
import { useQuery } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API helper for REST requests
import api from '../utils/api';
// BEHAVIOR: Local cache helper to get and set fallback values in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useAllUsers — Fetches all registered users in the system.
 * Query key: ['users', 'all']
 * Used by: SuperAdminDashboard
 */
export const useAllUsers = (options = {}) => {
  // BEHAVIOR: Invokes query mechanism to fetch and cache user directory
  return useQuery({
    // BEHAVIOR: Query key identifiers for cache lookup
    queryKey: ['users', 'all'],
    // BACKEND_CONNECTION: GET /users - Queries full directory of registered users from database
    queryFn: async () => {
      const response = await api.get('/users');
      if (!response.data.success) {
        throw new Error('Failed to fetch users');
      }
      const data = response.data.data;
      // BEHAVIOR: Stores fetched payload locally in localStorage cache
      setCachedData('users_all', data);
      return data;
    },
    // BEHAVIOR: Supplies initial cache state from localStorage to load list immediately
    initialData: () => {
      const cached = getCachedData('users_all');
      return cached?.data;
    },
    // BEHAVIOR: Supplies timestamp of cached data to check if it is stale on mount
    initialDataUpdatedAt: () => {
      const cached = getCachedData('users_all');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 2 minutes — will auto-refetch in background if data is older than 2 mins
    staleTime: 2 * 60 * 1000,   // 2 minutes — user list rarely changes
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch user list on tab focus — wastes bandwidth
    refetchIntervalInBackground: false,
    ...options,
  });
};
