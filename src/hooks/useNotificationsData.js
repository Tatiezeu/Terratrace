// BEHAVIOR: Custom hooks for querying notification inbox, sent messages, and system recipients using TanStack Query.
import { useQuery } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API helper loaded with standard user authorization headers
import api from '../utils/api';
// BEHAVIOR: Local cache helper to get and set fallback values in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useNotifications — Fetches inbox notifications for the current user.
 * Query key: ['notifications']
 * Used by: NotificationsPage, SuperAdminDashboard
 */
export const useNotifications = () => {
  // BEHAVIOR: Fetches inbox notifications for the user
  return useQuery({
    // BEHAVIOR: Inbox query key identifier
    queryKey: ['notifications'],
    // BACKEND_CONNECTION: GET /notifications - Fetches received notifications/inbox list for the current session user
    queryFn: async () => {
      const response = await api.get('/notifications');
      if (!response.data.success) {
        throw new Error('Failed to fetch notifications');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches received notifications segment in localStorage
      setCachedData('notifications', data);
      return data;
    },
    // BEHAVIOR: Returns immediate cached inbox state if present
    initialData: () => {
      const cached = getCachedData('notifications');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('notifications');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 30 seconds. Checks frequently so notifications appear fast
    staleTime: 30 * 1000, // 30 seconds — check frequently for new messages
  });
};

/**
 * useSentNotifications — Fetches sent notifications for the current user.
 * Query key: ['notifications', 'sent']
 * Used by: NotificationsPage
 */
export const useSentNotifications = () => {
  // BEHAVIOR: Fetches notifications sent by the current user
  return useQuery({
    // BEHAVIOR: Sent notifications query key identifier
    queryKey: ['notifications', 'sent'],
    // BACKEND_CONNECTION: GET /notifications/sent - Fetches notifications sent by the current user
    queryFn: async () => {
      const response = await api.get('/notifications/sent');
      if (!response.data.success) {
        throw new Error('Failed to fetch sent notifications');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches sent notifications segment in localStorage
      setCachedData('notifications_sent', data);
      return data;
    },
    // BEHAVIOR: Supplies initial sent notifications cache from localStorage
    initialData: () => {
      const cached = getCachedData('notifications_sent');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('notifications_sent');
      return cached?.timestamp;
    },
    staleTime: 60 * 1000,
  });
};

/**
 * useRecipients — Fetches list of users that can receive messages.
 * Query key: ['users', 'recipients']
 * Used by: NotificationsPage, NotaryDashboard (for LRO list)
 */
export const useRecipients = () => {
  // BEHAVIOR: Fetches list of potential recipients for sending a notification
  return useQuery({
    // BEHAVIOR: Recipients directory query key identifier
    queryKey: ['users', 'recipients'],
    // BACKEND_CONNECTION: GET /users/recipients - Retrieves potential recipients list from the database
    queryFn: async () => {
      const response = await api.get('/users/recipients');
      if (!response.data.success) {
        throw new Error('Failed to fetch recipients');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches recipient directory segment in localStorage
      setCachedData('users_recipients', data);
      return data;
    },
    // BEHAVIOR: Supplies initial recipients directory cache from localStorage
    initialData: () => {
      const cached = getCachedData('users_recipients');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('users_recipients');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 5 minutes. User directories update slowly
    staleTime: 5 * 60 * 1000, // 5 minutes — user list changes rarely
  });
};
