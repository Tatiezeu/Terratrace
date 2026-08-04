// BEHAVIOR: Custom hooks for fetching and managing global system configurations using TanStack Query.
import { useQuery } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API helper for communication with backend routes
import api from '../utils/api';
// BEHAVIOR: Local cache helper to get and set configuration values in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useConfig - CENTRALIZED hook to fetch system configurations.
 * Caches config in React Query and persists it to localStorage.
 */
export const useConfig = () => {
  // BEHAVIOR: React query wrapper around settings parameters
  return useQuery({
    // BEHAVIOR: Settings identifier token for caching
    queryKey: ['settings_config'],
    // BACKEND_CONNECTION: GET /config - Retreives system parameters (fees, keys, wallet numbers) from DB
    queryFn: async () => {
      const response = await api.get('/config');
      if (!response.data.success) {
        throw new Error('Failed to fetch system configurations');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches settings inside local storage for offline retrieval
      setCachedData('settings_config', data);
      return data;
    },
    // BEHAVIOR: Retrieves immediate settings state from localStorage on load
    initialData: () => {
      const cached = getCachedData('settings_config');
      return cached?.data;
    },
    // BEHAVIOR: Gets config cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('settings_config');
      return cached?.timestamp;
    },
    // BEHAVIOR: 10 minutes stale duration. Configuration parameters are rarely updated
    staleTime: 10 * 60 * 1000, // 10 minutes - config changes very rarely
  });
};

export default useConfig;
