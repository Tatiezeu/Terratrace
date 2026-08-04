// BEHAVIOR: Custom hooks for managing query operations on transfer dossiers and public notices using TanStack Query.
import { useQuery } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API helper loaded with standard user authorization headers
import api from '../utils/api';
// BEHAVIOR: Local cache helper to get and set fallback values in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useMyTransfers — Fetches all transfer requests for the current user.
 * Query key: ['transfers']
 * Shared across: ClientDashboard, ApplicationTracking, NotaryDashboard, LRODashboard
 */
export const useMyTransfers = () => {
  // BEHAVIOR: Queries and caches the user's active/completed transfer requests
  return useQuery({
    // BEHAVIOR: Cache key identifier for user transfers
    queryKey: ['transfers'],
    // BACKEND_CONNECTION: GET /transfer/my-transfers - Retrieves all transfer dossiers relevant to the logged-in user (as sender, buyer, LRO, or Notary)
    queryFn: async () => {
      const response = await api.get('/transfer/my-transfers');
      if (!response.data.success) {
        throw new Error('Failed to fetch transfer requests');
      }
      const data = response.data.data;
      // BEHAVIOR: Persists transfers list inside localStorage cache
      setCachedData('transfers', data);
      return data;
    },
    // BEHAVIOR: Retreives initial transfers array from local cache
    initialData: () => {
      const cached = getCachedData('transfers');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('transfers');
      return cached?.timestamp;
    },
    // BEHAVIOR: 10 seconds staleTime & 5-second polling interval for real-time workflow status sync
    staleTime: 3 * 1000,
    refetchInterval: 3000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * usePublicNotices — Fetches all public land transfer notices.
 * Query key: ['transfers', 'public-notices']
 * Used by: NoticeBoardPage
 */
export const usePublicNotices = () => {
  // BEHAVIOR: Queries public notices (opposition/publication phase)
  return useQuery({
    // BEHAVIOR: Cache key for public notices query
    queryKey: ['transfers', 'public-notices'],
    // BACKEND_CONNECTION: GET /transfer/public-notices - Retrieves all published notices visible to the public
    queryFn: async () => {
      const response = await api.get('/transfer/public-notices');
      if (!response.data.success) {
        throw new Error('Failed to fetch public notices');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches notices list segment locally
      setCachedData('transfers_public-notices', data);
      return data;
    },
    // BEHAVIOR: Supplies initial notices array from localStorage
    initialData: () => {
      const cached = getCachedData('transfers_public-notices');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('transfers_public-notices');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 2 minutes — public notices are relatively static
    staleTime: 30 * 1000,
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
