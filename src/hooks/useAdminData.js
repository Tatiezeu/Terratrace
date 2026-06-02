import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * useAllUsers — Fetches all registered users in the system.
 * Query key: ['users', 'all']
 * Used by: SuperAdminDashboard
 */
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await api.get('/users');
      if (!response.data.success) {
        throw new Error('Failed to fetch users');
      }
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — user registry changes infrequently
  });
};
