import { api, setTokens, clearTokens, getRefreshToken } from './api';
import type { User, AuthTokens, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types';

const AUTH_BASE = 'auth/';

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>(`${AUTH_BASE}login/`, data);
    const tokens = response.data;
    setTokens(tokens.access, tokens.refresh);
    return tokens;
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>(`${AUTH_BASE}register/`, data);
    return response.data;
  },

  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post(`${AUTH_BASE}logout/`, { refresh });
      }
    } catch {
      // Ignore logout errors — token may already be expired
    } finally {
      clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(`${AUTH_BASE}profile/`);
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`${AUTH_BASE}profile/`, data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post(`${AUTH_BASE}change-password/`, data);
  },

  async refreshToken(): Promise<AuthTokens | null> {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const response = await api.post<AuthTokens>(`${AUTH_BASE}refresh/`, { refresh });
      const tokens = response.data;
      setTokens(tokens.access, tokens.refresh || refresh);
      return tokens;
    } catch {
      clearTokens();
      return null;
    }
  },
};
