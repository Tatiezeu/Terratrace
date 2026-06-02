import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

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
      return response.data.data;
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
      return response.data.data;
    },
    staleTime: 60 * 1000,
  });
};
