// Horario estructurado de una actividad
export interface ActivitySchedule {
  id: number;
  dayOfWeek: number; // 0 = Domingo ... 6 = Sábado
  dayName: string;   // "Lunes"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  spaceId?: number;  // Espacio asignado (si aplica)
}

export type AssignmentStatus = 'Pending' | 'Accepted' | 'Rejected';

// Profesor/administrador a cargo de una actividad
export interface ActivityInstructor {
  id: number;
  fullName: string;
  email: string;
  status: AssignmentStatus;
  /** Fecha en que se envió la invitación (ISO). Solo relevante para pendientes. */
  invitedAt?: string | null;
}

// Actividad del catálogo (GET /api/activities)
export interface Activity {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  priceMember: number;
  priceNonMember: number;
  /** Día del mes (1-28) hasta el cual se puede pagar sin recargo. */
  diaVencimiento: number;
  /** Tipo de recargo por mora: 'Ninguno' | 'Porcentaje' | 'MontoFijo'. */
  tipoRecargoMora: 'Ninguno' | 'Porcentaje' | 'MontoFijo';
  /** Valor del recargo por mora para Socios (% o $). */
  recargoMoraSocio: number;
  /** Valor del recargo por mora para No Socios (% o $). */
  recargoMoraNoSocio: number;
  facilityCanon: number;
  aplicaDescuentoSocios: boolean;
  tipoDescuentoCanon: 'PORCENTAJE' | 'MONTO_FIJO';
  valorDescuentoPorSocio: number;
  descuentoMaximoCanon?: number | null;
  estadoNegociacion?: string | null;
  proposedPriceMember?: number | null;
  proposedFacilityCanon?: number | null;
  paymentCollector: 'CLUB' | 'PROFESSOR_DIRECT';
  professorFacilityFeeMember: number;
  professorFacilityFeeNonMember: number;
  professorMercadoPagoPublicKey?: string;

  // Datos de cobro directo del profesor (solo PROFESSOR_DIRECT)
  professorBankAlias?: string | null;
  professorHasMercadoPago?: boolean;
  professorMercadoPagoUserId?: string | null;

  maxCapacity: number;
  teacherId?: number | null;
  teacherName?: string | null;
  teacherTipoProfesor?: string | null;
  requiresBooking: boolean;
  schedule: string;
  isActive: boolean;
  schedules: ActivitySchedule[];
  enrolledCount: number;
  availableSpots: number;

  /** Precio Socio programado para el próximo período. null = sin cambio pendiente. */
  pendingPriceMember?: number | null;
  /** Precio No Socio programado para el próximo período. null = sin cambio pendiente. */
  pendingPriceNonMember?: number | null;
  /** Período "yyyy-MM" del aumento pendiente (si existe). */
  pendingPricePeriod?: string | null;
  /** Fecha ISO (1° del mes) desde la que rige el precio pendiente. */
  pendingPriceEffectiveFromDate?: string | null;

  // Profesores/administradores a cargo
  instructors?: ActivityInstructor[];

  // Espacio físico donde se dicta
  spaceId?: number;
  spaceName?: string;
}

// Entrada de un horario al crear/actualizar una actividad (POST/PUT /api/activities).
export interface ActivityScheduleInput {
  dayOfWeek: number; // 0 = Domingo ... 6 = Sábado
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

// Payload para crear/actualizar una actividad.
export interface SaveActivityRequest {
  name: string;
  description: string;
  category: string;
  priceMember: number;
  priceNonMember: number;
  /** Día del mes (1-28) hasta el cual se puede pagar sin recargo. */
  diaVencimiento: number;
  /** Tipo de recargo por mora: 'Ninguno' | 'Porcentaje' | 'MontoFijo'. */
  tipoRecargoMora: 'Ninguno' | 'Porcentaje' | 'MontoFijo';
  /** Valor del recargo por mora para Socios (% o $). */
  recargoMoraSocio: number;
  /** Valor del recargo por mora para No Socios (% o $). */
  recargoMoraNoSocio: number;
  facilityCanon: number;
  aplicaDescuentoSocios: boolean;
  tipoDescuentoCanon: 'PORCENTAJE' | 'MONTO_FIJO';
  valorDescuentoPorSocio: number;
  descuentoMaximoCanon?: number | null;
  estadoNegociacion?: string | null;
  proposedPriceMember?: number | null;
  proposedFacilityCanon?: number | null;
  paymentCollector: 'CLUB' | 'PROFESSOR_DIRECT';
  professorMercadoPagoPublicKey?: string;
  professorMercadoPagoAccessToken?: string;
  maxCapacity: number;
  teacherId?: number | null;
  instructorIds?: number[];
  spaceId?: number | null;
  requiresBooking: boolean;
  isActive: boolean;
  schedule: string;
  schedules: ActivityScheduleInput[];
}

// Liquidación de una actividad
export interface ActivitySettlement {
  activityId: number;
  activityName: string;
  totalEnrollments: number;
  memberEnrollments: number;
  nonMemberEnrollments: number;
  memberFee: number;
  nonMemberFee: number;
  facilityCanon: number;
  totalSettlement: number;
  discountApplied: number;
}

// Inscripción del usuario autenticado (GET /api/enrollments/my)
export interface MyEnrollment {
  id: number;
  activityId: number;
  activityName: string;
  spaceName?: string | null;
  instructorName?: string | null;
  status: string; // ACTIVE | CANCELED
  enrollmentDate: string;
  schedules: ActivitySchedule[];
}

// Previsión de precio por período de una actividad (GET /api/activities/{id}/price-history)
export interface ActivityPricePeriod {
  id: number;
  activityId: number;
  period: string; // "yyyy-MM"
  priceMember: number;
  priceNonMember: number;
  effectiveFromDate: string;
  changedAt: string;
  changedByUserId?: number | null;
}

// Payload para programar un aumento (POST /api/activities/{id}/price-updates)
export interface ScheduleActivityPriceRequest {
  priceMember: number;
  priceNonMember: number;
  year: number;
  month: number; // 1-12
}