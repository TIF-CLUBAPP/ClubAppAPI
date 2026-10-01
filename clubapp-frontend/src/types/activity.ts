// Horario estructurado de una actividad
export interface ActivitySchedule {
  id: number;
  dayOfWeek: number; // 0 = Domingo ... 6 = Sábado
  dayName: string;   // "Lunes"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  spaceId?: number;  // Espacio asignado (si aplica)
}

// Actividad del catálogo (GET /api/activities)
export interface Activity {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  maxCapacity: number;
  teacherId?: number | null;
  teacherName?: string | null;
  requiresBooking: boolean;
  schedule: string;
  isActive: boolean;
  schedules: ActivitySchedule[];
  enrolledCount: number;
  availableSpots: number;

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
  maxCapacity: number;
  teacherId?: number | null;
  spaceId?: number | null;
  requiresBooking: boolean;
  isActive: boolean;
  schedule: string;
  schedules: ActivityScheduleInput[];
}