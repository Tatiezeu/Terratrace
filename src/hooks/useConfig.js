import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useConfig - CENTRALIZED hook to fetch system configurations.
 * Caches config in React Query and persists it to localStorage.
 */
export const useConfig = () => {
  return useQuery({
    queryKey: ['settings_config'],
    queryFn: async () => {
      const response = await api.get('/config');
      if (!response.data.success) {
        throw new Error('Failed to fetch system configurations');
      }
      const data = response.data.data;
      setCachedData('settings_config', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('settings_config');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('settings_config');
      return cached?.timestamp;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - config changes very rarely
  });
};

export default useConfig;
