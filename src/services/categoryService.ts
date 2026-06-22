import { req } from './api';
import type { Category } from '../types';

interface CategoryPayload {
  name: string;
  youtubePlaylistId: string;
  youtubeCategoryId: string;
}

export const categoryService = {
  list: (): Promise<Category[]> =>
    req<Category[]>('/api/categories/'),

  create: (data: CategoryPayload): Promise<Category> =>
    req<Category>('/api/categories/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: CategoryPayload): Promise<Category> =>
    req<Category>(`/api/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    req(`/api/categories/${id}/`, { method: 'DELETE' }),
};
