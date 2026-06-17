import { req, setTokens, clearTokens } from './api';
import type { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await req<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
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
