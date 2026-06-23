import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useMyTransfers — Fetches all transfer requests for the current user.
 * Query key: ['transfers']
 * Shared across: ClientDashboard, ApplicationTracking, NotaryDashboard, LRODashboard
 */
export const useMyTransfers = () => {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const response = await api.get('/transfer/my-transfers');
      if (!response.data.success) {
        throw new Error('Failed to fetch transfer requests');
      }
      const data = response.data.data;
      setCachedData('transfers', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('transfers');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('transfers');
      return cached?.timestamp;
    },
    staleTime: 30 * 1000, // 30 seconds — transfers change more frequently
  });
};

/**
 * usePublicNotices — Fetches all public land transfer notices.
 * Query key: ['transfers', 'public-notices']
 * Used by: NoticeBoardPage
 */
export const usePublicNotices = () => {
  return useQuery({
    queryKey: ['transfers', 'public-notices'],
    queryFn: async () => {
      const response = await api.get('/transfer/public-notices');
      if (!response.data.success) {
        throw new Error('Failed to fetch public notices');
      }
      const data = response.data.data;
      setCachedData('transfers_public-notices', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('transfers_public-notices');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('transfers_public-notices');
      return cached?.timestamp;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — notices are semi-static
  });
};
