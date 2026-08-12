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
    queryFn: async ({ signal }) => {
      // BEHAVIOR: ETag-based conditional request — skip re-processing if data hasn't changed
      const cachedEtag = sessionStorage.getItem('etag_transfers');
      const headers = cachedEtag ? { 'If-None-Match': cachedEtag } : {};
      try {
        const response = await api.get('/transfer/my-transfers', { headers, signal });
        if (response.status === 304) {
          // Not modified — return cached data as-is
          const cached = getCachedData('transfers');
          return cached?.data ?? [];
        }
        if (!response.data.success) throw new Error('Failed to fetch transfer requests');
        const data = response.data.data;
        const newEtag = response.headers['etag'];
        if (newEtag) sessionStorage.setItem('etag_transfers', newEtag);
        setCachedData('transfers', data);
        return data;
      } catch (err) {
        if (err?.response?.status === 304) {
          const cached = getCachedData('transfers');
          return cached?.data ?? [];
        }
        throw err;
      }
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
    staleTime: 5 * 1000,
    refetchInterval: 6000,       // Poll every 6s — still fast for workflow status updates
    refetchIntervalInBackground: false, // Stop polling when tab is hidden — saves bandwidth
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
