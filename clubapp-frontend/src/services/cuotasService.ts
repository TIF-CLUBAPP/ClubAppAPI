import { api } from './api';
import type { CuotasVencidasStats, CuotaVencida } from '../types/cuotas';

export const cuotasService = {
  /** Estadísticas: cantidad de cuotas impagas y monto total adeudado. */
  getOverdueStats: async (): Promise<CuotasVencidasStats> => {
    const response = await api.get<CuotasVencidasStats>('/cuotas/vencidas/stats');
    return response.data;
  },

  /** Lista detallada de socios con deuda. */
  getOverdueList: async (): Promise<CuotaVencida[]> => {
    const response = await api.get<CuotaVencida[]>('/cuotas/vencidas');
    return response.data;
  },

  /** Marca una cuota como pagada (cobro en caja). */
  registrarPago: async (cuotaId: number): Promise<void> => {
    await api.post(`/cuotas/${cuotaId}/registrar-pago`);
  },
};
