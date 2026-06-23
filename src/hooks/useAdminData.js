import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useAllUsers — Fetches all registered users in the system.
 * Query key: ['users', 'all']
 * Used by: SuperAdminDashboard
 */
export const useAllUsers = (options = {}) => {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await api.get('/users');
      if (!response.data.success) {
        throw new Error('Failed to fetch users');
      }
      const data = response.data.data;
      setCachedData('users_all', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('users_all');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('users_all');
      return cached?.timestamp;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — user registry changes infrequently
    ...options,
  });
};
