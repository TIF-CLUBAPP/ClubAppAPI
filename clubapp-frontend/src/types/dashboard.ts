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
