import { req } from './api';
import type { SaleVideo } from '../types';

interface SaleVideoListParams {
  status?: string;
  projectId?: number;
  search?: string;
}

export const saleVideoService = {
  list: (params: SaleVideoListParams = {}): Promise<SaleVideo[]> => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return req<SaleVideo[]>(`/api/sale-videos/${qs ? '?' + qs : ''}`);
  },

  get: (id: number) => req<SaleVideo>(`/api/sale-videos/${id}/`),

  create: (formData: FormData) =>
    req<SaleVideo>('/api/sale-videos/', { method: 'POST', body: formData }),

  reupload: (id: number, formData: FormData) =>
    req<SaleVideo>(`/api/sale-videos/${id}/reupload/`, { method: 'POST', body: formData }),

  startReview: (id: number) =>
    req<SaleVideo>(`/api/sale-videos/${id}/start-review/`, { method: 'POST' }),

  approve: (id: number) =>
    req<SaleVideo>(`/api/sale-videos/${id}/approve/`, { method: 'POST' }),

  reject: (id: number, reason: string) =>
    req<SaleVideo>(`/api/sale-videos/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  revision: (id: number, note: string) =>
    req<SaleVideo>(`/api/sale-videos/${id}/revision/`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
};
