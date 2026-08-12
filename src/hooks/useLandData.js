// BEHAVIOR: Custom hooks for querying registered land plots using TanStack Query.
import { useQuery } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API client configured with auth headers
import api from '../utils/api';
// BEHAVIOR: Local cache helper to get and set cached plots in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useLandPlots — Fetches all land plots from the registry.
 * Query key: ['land']
 * Shared across: ClientDashboard, LandPlotsPage, LRODashboard, SuperAdminDashboard
 */
export const useLandPlots = () => {
  // BEHAVIOR: Queries and caches the full registry of land plots
  return useQuery({
    // BEHAVIOR: Cache key identifier for land plots query
    queryKey: ['land'],
    // BACKEND_CONNECTION: GET /land - Queries the server for all registered land plots in the system
    queryFn: async () => {
      const response = await api.get('/land');
      if (!response.data.success) {
        throw new Error('Failed to fetch land plots');
      }
      const data = response.data.data;
      // BEHAVIOR: Sets land plots array to localStorage cache
      setCachedData('land', data);
      return data;
    },
    // BEHAVIOR: Returns immediate cached state if present
    initialData: () => {
      const cached = getCachedData('land');
      return cached?.data;
    },
    // BEHAVIOR: Provides timestamp of cached land data
    initialDataUpdatedAt: () => {
      const cached = getCachedData('land');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 60 seconds. Plots don't change very frequently
    staleTime: 60 * 1000,        // Plots change rarely — 60s is fine
    refetchOnMount: 'always',    // Always revalidate on mount to get fresh plot status
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
};

/**
 * useMyLandPlots — Fetches the current user's own land plots.
 * Query key: ['land', 'my-plots']
 * Used by: MyLandPlotsPage
 */
export const useMyLandPlots = () => {
  // BEHAVIOR: Queries and caches plots owned specifically by the current logged-in user
  return useQuery({
    // BEHAVIOR: Cache key for current user's plots query
    queryKey: ['land', 'my-plots'],
    // BACKEND_CONNECTION: GET /land/my-plots - Queries the database for plots owned by the logged-in user
    queryFn: async () => {
      const response = await api.get('/land/my-plots');
      if (!response.data.success) {
        throw new Error('Failed to fetch your land plots');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches current user's plots data segment locally
      setCachedData('land_my-plots', data);
      return data;
    },
    // BEHAVIOR: Supplies initial user plots cache from localStorage
    initialData: () => {
      const cached = getCachedData('land_my-plots');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('land_my-plots');
      return cached?.timestamp;
    },
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
};
