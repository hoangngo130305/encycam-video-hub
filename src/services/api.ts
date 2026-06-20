import { API_BASE as BASE } from '../config';

export const getToken = () => localStorage.getItem('accessToken');
export const getRefreshTok = () => localStorage.getItem('refreshToken');

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshTok();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: rt }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    localStorage.setItem('accessToken', data.access);
    if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function req<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return req<T>(path, init, false);
    clearTokens();
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('Phiên đăng nhập đã hết hạn');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.detail || data.message || JSON.stringify(data) || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function downloadReq(path: string, filename: string, retry = true): Promise<void> {
  const headers: Record<string, string> = {};
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return downloadReq(path, filename, false);
    clearTokens();
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('Phiên đăng nhập đã hết hạn');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.detail || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** DRF PageNumberPagination wrapper */
export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }
