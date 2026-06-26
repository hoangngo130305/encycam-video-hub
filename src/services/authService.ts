import { API_BASE as BASE } from '../config';
import { req, setTokens, clearTokens } from './api';
import type { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Gọi thẳng fetch, không dùng req() để tránh retry-refresh logic khi sai mật khẩu
    const res = await fetch(`${BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let msg = 'Email hoặc mật khẩu không đúng.';
      try { const d = await res.json(); msg = d.detail || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    const data: LoginResponse = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const rt = localStorage.getItem('refreshToken');
    try {
      if (rt) {
        await req('/api/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rt }),
        });
      }
    } catch { /* ignore */ } finally {
      clearTokens();
    }
  },

  me: () => req<User>('/api/auth/me/'),
};
