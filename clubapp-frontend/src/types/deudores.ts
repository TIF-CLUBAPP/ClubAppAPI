// Gestión de cuotas vencidas / deudores (GET /api/cuotas/vencidas/stats)
export interface CuotasVencidasStats {
  totalCuotasVencidas: number;
  montoTotalDeuda: number;
}

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

}