import { api } from './api';
import type { Court, PaginatedResponse } from '../types';

export const courtService = {
  async getCourts(params?: Record<string, string>): Promise<Court[]> {
    const response = await api.get<PaginatedResponse<Court> | Court[]>('courts/', { params });
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) return response.data;
    return response.data.results;
  },

  async getCourt(id: number): Promise<Court> {
    const response = await api.get<Court>(`courts/${id}/`);
    return response.data;
  },

  async createCourt(data: FormData): Promise<Court> {
    const response = await api.post<Court>('courts/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateCourt(id: number, data: FormData): Promise<Court> {
    const response = await api.patch<Court>(`courts/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteCourt(id: number): Promise<void> {
    await api.delete(`courts/${id}/`);
  },
};
