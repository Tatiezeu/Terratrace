import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useLandPlots — Fetches all land plots from the registry.
 * Query key: ['land']
 * Shared across: ClientDashboard, LandPlotsPage, LRODashboard, SuperAdminDashboard
 */
export const useLandPlots = () => {
  return useQuery({
    queryKey: ['land'],
    queryFn: async () => {
      const response = await api.get('/land');
      if (!response.data.success) {
        throw new Error('Failed to fetch land plots');
      }
      const data = response.data.data;
      setCachedData('land', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('land');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('land');
      return cached?.timestamp;
    },
    staleTime: 60 * 1000, // 60 seconds — plots don't change frequently
  });
};

/**
 * useMyLandPlots — Fetches the current user's own land plots.
 * Query key: ['land', 'my-plots']
 * Used by: MyLandPlotsPage
 */
export const useMyLandPlots = () => {
  return useQuery({
    queryKey: ['land', 'my-plots'],
    queryFn: async () => {
      const response = await api.get('/land/my-plots');
      if (!response.data.success) {
        throw new Error('Failed to fetch your land plots');
      }
      const data = response.data.data;
      setCachedData('land_my-plots', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('land_my-plots');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('land_my-plots');
      return cached?.timestamp;
    },
    staleTime: 60 * 1000,
  });
};
