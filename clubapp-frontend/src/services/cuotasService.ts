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
    const response = await api.get<any[]>('/cuotas/vencidas');
    console.log("Respuesta Deudores Backend (raw):", response.data);
    
    // Mapear propiedades de PascalCase (C#) a camelCase (TypeScript) si es necesario
    const mapped = response.data.map((item: any) => ({
      socioId: item.SocioId ?? item.socioId,
      nombre: item.Nombre ?? item.nombre,
      apellido: item.Apellido ?? item.apellido,
      email: item.Email ?? item.email,
      telefono: item.Telefono ?? item.telefono,
      dni: item.Dni ?? item.dni,
      cantidadCuotasImpagas: item.CantidadCuotasImpagas ?? item.cantidadCuotasImpagas ?? 0,
      cuotasPendientes: item.CuotasPendientes ?? item.cuotasPendientes,
      cuotasImpagas: item.CuotasImpagas ?? item.cuotasImpagas,
      periodosVencidos: item.PeriodosVencidos ?? item.periodosVencidos ?? [],
      montoTotalAdeudado: item.MontoTotalAdeudado ?? item.montoTotalAdeudado ?? 0,
      diasDeAtraso: item.DiasDeAtraso ?? item.diasDeAtraso ?? 0,
      paymentIds: item.PaymentIds ?? item.paymentIds ?? [],
      esAutoBloqueado: item.EsAutoBloqueado ?? item.esAutoBloqueado ?? false,
      esBloqueadoManual: item.EsBloqueadoManual ?? item.esBloqueadoManual ?? false,
      estaBloqueado: item.EstaBloqueado ?? item.estaBloqueado ?? false,
    }));
    
    console.log("Deudores mapeados:", mapped);
    return mapped as CuotaVencida[];
  },

  /** Marca una cuota como pagada (cobro en caja). */
  registrarPago: async (cuotaId: number): Promise<void> => {
    await api.post(`/cuotas/${cuotaId}/registrar-pago`);
  },

  /** Bloquea o desbloquea un usuario (cambia IsActive). */
  updateUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await api.patch(`/users/${userId}/status`, { isActive });
  },
};
