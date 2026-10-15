// Gestión de cuotas vencidas / deudores (GET /api/cuotas/vencidas/stats)
export interface CuotasVencidasStats {
  totalCuotasVencidas: number;
  montoTotalDeuda: number;
}

// Estado de la cuota / situación del socio en el padrón de deudores
export type EstadoCuota = 'EN_MORA' | 'PENDIENTE' | 'AL_DIA' | 'EXENTO';

// Detalle de deuda de un socio (GET /api/cuotas/vencidas)
export interface CuotaVencida {
  socioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  cantidadCuotasImpagas: number;
  cuotasPendientes?: number;
  cuotasImpagas?: number;
  periodosVencidos: string[];
  montoTotalAdeudado: number;
  diasDeAtraso: number;
  paymentIds: number[];
  esAutoBloqueado: boolean;
  esBloqueadoManual: boolean;
  estaBloqueado: boolean;
  /** Porcentaje de exención aplicado al socio (0-100). 100 = no genera deuda. */
  exencionPorcentaje?: number;
  /** Porcentaje de mora aplicado sobre el subtotal bonificado (0-100). */
  moraPorcentaje?: number;
  /** Situación consolidada del socio para filtros y badges. */
  estadoCuota?: EstadoCuota;
  /** Motivo de la exención (ej. "Jubilado", "Staff"). */
  motivoExencion?: string;
}