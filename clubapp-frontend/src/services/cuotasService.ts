import { api } from './api';
import type { CuotasVencidasStats, CuotaVencida } from '../types/cuotas';
import { MOCK_DEBTORS, MOCK_DEBTORS_WITH_DEBT, type DebtorUser } from '../data/mockDebtors';

// Flag para forzar el uso del dataset de prueba aun con backend disponible.
// Útil para demos/QA de la pantalla "Deudores & Cuotas".
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DEBTORS === 'true';

/** Estadísticas calculadas sobre el dataset de prueba. */
const buildMockStats = (): CuotasVencidasStats => ({
  totalCuotasVencidas: MOCK_DEBTORS.reduce(
    (acc: number, d: DebtorUser) => acc + d.cantidadCuotasImpagas,
    0,
  ),
  montoTotalDeuda: MOCK_DEBTORS.reduce(
    (acc: number, d: DebtorUser) => acc + d.montoTotalAdeudado,
    0,
  ),
});

export const cuotasService = {
  /** Estadísticas: cantidad de cuotas impagas y monto total adeudado. */
  getOverdueStats: async (): Promise<CuotasVencidasStats> => {
    if (USE_MOCK_DATA) return buildMockStats();
    try {
      const response = await api.get<CuotasVencidasStats>('/cuotas/vencidas/stats');
      return response.data;
    } catch (err) {
      console.warn('Backend no disponible, usando dataset mock de deudores.', err);
      return buildMockStats();
    }
  },

  /** Lista detallada de socios del padrón (con y sin deuda). */
  getOverdueList: async (): Promise<CuotaVencida[]> => {
    if (USE_MOCK_DATA) return [...MOCK_DEBTORS];

    try {
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
    } catch (err) {
      console.warn('Backend no disponible, usando dataset mock de deudores.', err);
      // En modo demo devolvemos el padrón completo para que búsqueda y filtros
      // muestren también a los socios sin deuda; la pantalla filtra por estado.
      return [...MOCK_DEBTORS_WITH_DEBT, ...MOCK_DEBTORS.filter((d: DebtorUser) => d.cuotasAdeudadas.length === 0)];
    }
  },

  /** Marca una cuota como pagada (cobro en caja). */
  registrarPago: async (cuotaId: number): Promise<void> => {
    await api.post(`/cuotas/${cuotaId}/registrar-pago`);
  },

  /**
   * Cobro parcial: registra el pago únicamente de las cuotas seleccionadas.
   * Envía el array de IDs al backend en una sola transacción.
   */
  registrarPagoParcial: async (cuotaIds: number[]): Promise<void> => {
    if (!cuotaIds || cuotaIds.length === 0) return;
    await api.post('/cuotas/registrar-pago', { cuotaIds });
  },

  /** Bloquea o desbloquea un usuario (cambia IsActive). */
  updateUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await api.patch(`/users/${userId}/status`, { isActive });
  },
};
