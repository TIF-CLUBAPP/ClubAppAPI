// Horario estructurado de una actividad
export interface ActivitySchedule {
  id: number;
  dayOfWeek: number; // 0 = Domingo ... 6 = Sábado
  dayName: string;   // "Lunes"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  spaceId?: number;  // Espacio asignado (si aplica)
}

// Profesor/administrador a cargo de una actividad
export interface ActivityInstructor {
  id: number;
  fullName: string;
  email: string;
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
  requiresBooking: boolean;
  schedule: string;
  isActive: boolean;
  schedules: ActivitySchedule[];
  enrolledCount: number;
  availableSpots: number;

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
  price: number;
  priceMember: number;
  priceNonMember: number;
  paymentCollector: 'CLUB' | 'PROFESSOR_DIRECT';
  professorFacilityFeeMember: number;
  professorFacilityFeeNonMember: number;
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
  totalSettlement: number;
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