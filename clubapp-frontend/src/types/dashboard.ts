// Estadísticas del Dashboard administrativo (GET /api/dashboard/stats)
export interface DashboardStats {
  /** Socios con membresía activa. */
  sociosActivos: number;
  /** Total de usuarios con rol MEMBER (socios registrados). */
  totalSocios: number;
  /** Nuevos socios registrados en el mes en curso. */
  nuevosEsteMes: number;
  /** Usuarios NO socios con al menos una inscripción activa a actividades. */
  noSociosEnActividades: number;
  /** Usuarios que se dieron de baja en el mes (membresía cancelada/vencida). */
  bajasEsteMes: number;
  /** Recaudación del mes por CUOTAS. */
  recaudacionCuotas: number;
  /** Recaudación del mes por ACTIVIDADES. */
  recaudacionActividades: number;
  /** Total recaudado del mes (cuotas + actividades). */
  totalRecaudado: number;
  /** Recaudación del mes en curso (pagos completados). Retrocompatible. */
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

export interface DashboardDto {
  hasClub: boolean;
  userName: string;
  clubName?: string;
  membershipSummary?: {
    hasActiveMembership: boolean;
    membershipName?: string;
    amount: number;
    nextDueDate?: string;
    status: string;
  };
  recentCuotas: any[];
  upcomingReservations: any[];
}

// ============ Paneles de control exclusivos para administradores ============

/** Selector de rango temporal compartido por ambos paneles. */
export type RangoTemporal = 'dia' | 'semana' | 'mes' | 'anio';

/** Punto de la serie temporal de flujo de socios. */
export interface PuntoSerie {
  etiqueta: string;
  clave: string;
  altas: number;
  bajas: number;
  neto: number;
}

/** Punto temporal de ingresos desglosados. */
export interface IngresoPeriodo {
  etiqueta: string;
  clave: string;
  cuotas: number;
  alquileres: number;
  actividades: number;
  total: number;
}

/** Estadística individual por persona. */
export interface PersonaMetrica {
  userId: number;
  fullName: string;
  esSocio: boolean;
  alquileres: number;
  actividades: number;
}

/** Respuesta del panel "Control de Socios" (GET /api/dashboard/control-socios). */
export interface ControlSocios {
  sociosActivos: number;
  noSociosEnActividades: number;
  altasMes: number;
  bajasMes: number;
  netoMes: number;
  serieTemporal: PuntoSerie[];
  personas: PersonaMetrica[];
}

/** Respuesta del panel "Control de Recaudación" (GET /api/dashboard/control-recaudacion). */
export interface ControlRecaudacion {
  totalCuotas: number;
  totalAlquileres: number;
  totalActividades: number;
  totalGeneral: number;
  serieTemporal: IngresoPeriodo[];
}


