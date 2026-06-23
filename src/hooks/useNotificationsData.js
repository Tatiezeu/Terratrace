import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useNotifications — Fetches inbox notifications for the current user.
 * Query key: ['notifications']
 * Used by: NotificationsPage, SuperAdminDashboard
 */
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      if (!response.data.success) {
        throw new Error('Failed to fetch notifications');
      }
      const data = response.data.data;
      setCachedData('notifications', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('notifications');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('notifications');
      return cached?.timestamp;
    },
    staleTime: 30 * 1000, // 30 seconds — check frequently for new messages
  });
};

/**
 * useSentNotifications — Fetches sent notifications for the current user.
 * Query key: ['notifications', 'sent']
 * Used by: NotificationsPage
 */
export const useSentNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'sent'],
    queryFn: async () => {
      const response = await api.get('/notifications/sent');
      if (!response.data.success) {
        throw new Error('Failed to fetch sent notifications');
      }
      const data = response.data.data;
      setCachedData('notifications_sent', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('notifications_sent');
      return cached?.data;
    },
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
  return useQuery({
    queryKey: ['users', 'recipients'],
    queryFn: async () => {
      const response = await api.get('/users/recipients');
      if (!response.data.success) {
        throw new Error('Failed to fetch recipients');
      }
      const data = response.data.data;
      setCachedData('users_recipients', data);
      return data;
    },
    initialData: () => {
      const cached = getCachedData('users_recipients');
      return cached?.data;
    },
    initialDataUpdatedAt: () => {
      const cached = getCachedData('users_recipients');
      return cached?.timestamp;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — user list changes rarely
  });
};
