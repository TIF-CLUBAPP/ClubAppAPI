import { api } from './api';
import type { DashboardStats, SectorStatus, ControlSocios, ControlRecaudacion } from '../types/dashboard';
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

  /** Panel "Control de Socios" (GET /api/dashboard/control-socios). */
  getControlSocios: async (rango: string = 'mes'): Promise<ControlSocios> => {
    const response = await api.get<ControlSocios>('/dashboard/control-socios', { params: { rango } });
    return response.data;
  },

  /** Panel "Control de Recaudación" (GET /api/dashboard/control-recaudacion). */
  getControlRecaudacion: async (rango: string = 'mes'): Promise<ControlRecaudacion> => {
    const response = await api.get<ControlRecaudacion>('/dashboard/control-recaudacion', { params: { rango } });
    return response.data;
  },

  /** Estado en tiempo real de los espacios físicos del club (GET /api/dashboard/sectors). */
  getSectors: async (): Promise<SectorStatus[]> => {
    const response = await api.get<SectorStatus[]>('/dashboard/sectors');
    return response.data;
  },
};
