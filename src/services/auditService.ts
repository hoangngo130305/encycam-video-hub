import { req, getToken } from './api';
import type { AuditEntry } from '../types';

const BASE = 'http://127.0.0.1:8000';

interface AuditListParams { search?: string; resourceType?: string; page?: string }

interface PaginatedAudit {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditEntry[];
}

export const auditService = {
  list: (params: AuditListParams = {}): Promise<PaginatedAudit> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return req<PaginatedAudit>(`/api/audit/${qs ? '?' + qs : ''}`);
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
