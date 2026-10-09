// Horario estructurado de una actividad
export interface ActivitySchedule {
  id: number;
  dayOfWeek: number; // 0 = Domingo ... 6 = SÃ¡bado
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

// Actividad del catÃ¡logo (GET /api/activities)
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

  // Espacio fÃ­sico donde se dicta
  spaceId?: number;
  spaceName?: string;
}

// Entrada de un horario al crear/actualizar una actividad (POST/PUT /api/activities).
export interface ActivityScheduleInput {
  dayOfWeek: number; // 0 = Domingo ... 6 = SÃ¡bado
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

REPLACED

  teacherId?: number | null;
  instructorIds?: number[];
  spaceId?: number | null;
  requiresBooking: boolean;
  isActive: boolean;
  schedule: string;
  schedules: ActivityScheduleInput[];
}