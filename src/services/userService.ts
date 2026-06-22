import { req } from './api';
import type { User, Role } from '../types';

interface UserCreatePayload { name: string; email: string; role: Role; password?: string }
interface UserUpdatePayload { name?: string; email?: string; role?: Role; telegramChatId?: string }

export const userService = {
  list: (params?: { search?: string; role?: string }): Promise<User[]> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return req<User[]>(`/api/users/${qs ? '?' + qs : ''}`);
  },

  create: (data: UserCreatePayload) =>
    req<User>('/api/users/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: UserUpdatePayload) =>
    req<User>(`/api/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: number) =>
    req(`/api/users/${id}/`, { method: 'DELETE' }),

  toggleLock: (id: number) =>
    req<User>(`/api/users/${id}/toggle-lock/`, { method: 'POST' }),
};
