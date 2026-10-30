import { api } from './api';
import type { DashboardStats, SectorStatus } from '../types/dashboard';
import type { DashboardDto } from '../types/dashboard';

export const dashboardService = {
  getDashboard: async (): Promise<DashboardDto> => {
    const response = await api.get<DashboardDto>('/dashboard');
    return response.data;
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  /** Estado en tiempo real de los espacios físicos del club (GET /api/dashboard/sectors). */
  getSectors: async (): Promise<SectorStatus[]> => {
    const response = await api.get<SectorStatus[]>('/dashboard/sectors');
    return response.data;
  },
};
