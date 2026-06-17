const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const API_BASE   = isLocal ? 'http://127.0.0.1:8000'            : 'http://14.224.210.210:8009/api/v1';
export const ADMIN_BASE = isLocal ? 'http://127.0.0.1:8000'            : 'http://14.224.210.210:8009';
