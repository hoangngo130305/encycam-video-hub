import { req } from './api';
import type { Category } from '../types';

interface CategoryPayload {
  name: string;
  youtubePlaylistId: string;
  youtubeCategoryId: string;
  forSale?: boolean;
}

export const categoryService = {
  list: (params?: { forSale?: boolean }): Promise<Category[]> => {
    const qs = params?.forSale ? '?for_sale=true' : '';
    return req<Category[]>(`/api/categories/${qs}`);
  },

  create: (data: CategoryPayload): Promise<Category> =>
    req<Category>('/api/categories/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: CategoryPayload): Promise<Category> =>
    req<Category>(`/api/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    req(`/api/categories/${id}/`, { method: 'DELETE' }),
};
