import { req } from './api';
import type { Page } from './api';
import type { Notification } from '../types';

export const notificationService = {
  list: async (params?: { read?: boolean }): Promise<Notification[]> => {
    const qs = params?.read !== undefined ? `?read=${params.read}` : '';
    const res = await req<Page<Notification>>(`/api/notifications/${qs}`);
    return res.results;
  },

  markRead: (id: number) =>
    req<Notification>(`/api/notifications/${id}/read/`, { method: 'PATCH' }),

  markAllRead: () =>
    req('/api/notifications/read-all/', { method: 'POST' }),

  unreadCount: () =>
    req<{ count: number }>('/api/notifications/unread-count/'),
};
