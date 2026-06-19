import { req } from './api';
import type { Notification } from '../types';

export const notificationService = {
  list: (params?: { read?: boolean }): Promise<Notification[]> => {
    const qs = params?.read !== undefined ? `?read=${params.read}` : '';
    return req<Notification[]>(`/api/notifications/${qs}`);
  },

  markRead: (id: number) =>
    req<Notification>(`/api/notifications/${id}/read/`, { method: 'PATCH' }),

  markAllRead: () =>
    req('/api/notifications/read-all/', { method: 'POST' }),

  unreadCount: () =>
    req<{ count: number }>('/api/notifications/unread-count/'),
};
