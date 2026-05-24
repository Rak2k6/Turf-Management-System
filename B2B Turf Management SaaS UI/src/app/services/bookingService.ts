import { api } from './api';
import type { Booking, BookingCreateRequest, PaginatedResponse, SlotAvailability } from '../types';

export const bookingService = {
  async getBookings(params?: Record<string, string>): Promise<Booking[]> {
    const response = await api.get<PaginatedResponse<Booking> | Booking[]>('bookings/', { params });
    if (Array.isArray(response.data)) return response.data;
    return response.data.results;
  },

  async getBooking(id: number): Promise<Booking> {
    const response = await api.get<Booking>(`bookings/${id}/`);
    return response.data;
  },

  async createBooking(data: BookingCreateRequest): Promise<Booking> {
    const response = await api.post<Booking>('bookings/', data);
    return response.data;
  },

  async updateBooking(id: number, data: Partial<BookingCreateRequest>): Promise<Booking> {
    const response = await api.patch<Booking>(`bookings/${id}/`, data);
    return response.data;
  },

  async confirmBooking(id: number): Promise<void> {
    await api.post(`bookings/${id}/confirm/`);
  },

  async cancelBooking(id: number): Promise<void> {
    await api.post(`bookings/${id}/cancel/`);
  },

  async getMyBookings(): Promise<Booking[]> {
    const response = await api.get<PaginatedResponse<Booking> | Booking[]>('bookings/my-bookings/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results;
  },

  async getSlotAvailability(courtId: number, date: string): Promise<SlotAvailability[]> {
    const response = await api.get<SlotAvailability[]>('availability/', {
      params: { court: courtId, date },
    });
    return response.data;
  },
};
