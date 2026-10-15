// Estadísticas del Dashboard administrativo (GET /api/dashboard/stats)
export interface DashboardStats {
  /** Socios con membresía activa. */
  sociosActivos: number;
  /** Total de usuarios con rol MEMBER (socios registrados). */
  totalSocios: number;
  /** Nuevos socios registrados en el mes en curso. */
  nuevosEsteMes: number;
  /** Recaudación del mes en curso (pagos completados). */
  monthlyRevenue: number;
  /** Porcentaje cobrado del mes (0-100). */
  collectedPercentage: number;
  /** Cantidad de cuotas vencidas. */
  cuotasVencidas: number;
  /** Monto total adeudado por cuotas vencidas (incluye recargo por mora). */
  montoTotalDeuda: number;
}

// Estado en tiempo real de un espacio físico (GET /api/dashboard/sectors)
export type SectorStatusType = 'available' | 'occupied' | 'maintenance';

export interface SectorStatus {
  id: number;
  name: string;
  sportCategory: string;
  location: string;
  status: SectorStatusType;
  /** Personas / reservas que están usando el espacio en este momento. */
  currentOccupancy: number;
  /** Capacidad total del espacio (null si no se puede determinar). */
  capacity?: number | null;
  /** Próxima reserva o actividad del día en formato "HH:mm" (null si no hay). */
  nextTurn?: string | null;
  /** Indica si el espacio admite reservas particulares de socios. */
  isReservable?: boolean;
}
