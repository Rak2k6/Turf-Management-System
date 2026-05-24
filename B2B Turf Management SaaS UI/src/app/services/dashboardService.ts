import { api } from './api';
import type { ReportsSummary } from '../types';

export const dashboardService = {
  async getTodayBookings(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('dashboard/today-bookings/');
    return response.data;
  },

  async getTodayRevenue(): Promise<{ revenue: number }> {
    const response = await api.get<{ revenue: number }>('dashboard/today-revenue/');
    return response.data;
  },

  async getTotalBookings(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('dashboard/total-bookings/');
    return response.data;
  },

  async getCourtStats(): Promise<Array<{ court__name: string; count: number }>> {
    const response = await api.get('dashboard/court-stats/');
    return response.data;
  },

  async getReportsSummary(): Promise<ReportsSummary> {
    const response = await api.get<ReportsSummary>('dashboard/reports-summary/');
    return response.data;
  },
};
