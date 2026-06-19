import { req, getToken } from './api';
import type { AuditEntry } from '../types';
import { API_BASE as BASE } from '../config';

interface AuditListParams { search?: string; resourceType?: string; page?: string }

export interface AuditPage {
  results: AuditEntry[];
  count: number;
}

export const auditService = {
  list: async (params: AuditListParams = {}): Promise<AuditPage> => {
    // Backend trả array thẳng (max 200), bỏ qua 'page' vì không có server-side pagination
    const { page: _page, ...rest } = params;
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(rest).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    const results = await req<AuditEntry[]>(`/api/audit/${qs ? '?' + qs : ''}`);
    return { results, count: results.length };
  },

  exportCSV: async (params: Omit<AuditListParams, 'page'> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    const tok = getToken();
    const res = await fetch(`${BASE}/api/audit/export/${qs ? '?' + qs : ''}`, {
      headers: { Authorization: `Bearer ${tok ?? ''}` },
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },
};
