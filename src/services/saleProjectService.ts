import { req } from './api';
import type { SaleProject } from '../types';

interface SaleProjectPayload {
  name: string;
  categoryId: number;
  saleId?: number | null;
  saleManagerId?: number;
}

export const saleProjectService = {
  list: () => req<SaleProject[]>('/api/sale-projects/'),

  create: (data: SaleProjectPayload) =>
    req<SaleProject>('/api/sale-projects/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<SaleProjectPayload>) =>
    req<SaleProject>(`/api/sale-projects/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: number) =>
    req<void>(`/api/sale-projects/${id}/`, { method: 'DELETE' }),
};
