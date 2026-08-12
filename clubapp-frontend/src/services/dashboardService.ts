import { api } from './api';
import type { DashboardStats } from '../types/dashboard';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
