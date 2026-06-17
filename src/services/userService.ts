import { req } from './api';
import type { User, Role } from '../types';
import type { Page } from './api';

interface UserCreatePayload { name: string; email: string; role: Role; password?: string }
interface UserUpdatePayload { name?: string; email?: string; role?: Role }

export const userService = {
  list: async (params?: { search?: string; role?: string }): Promise<User[]> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    const res = await req<Page<User>>(`/api/users/${qs ? '?' + qs : ''}`);
    return res.results;
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
