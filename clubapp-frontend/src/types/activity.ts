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

// Horario estructurado de una actividad
export interface ActivitySchedule {
  id: number;
  dayOfWeek: number; // 0 = Domingo ... 6 = Sábado
  dayName: string;   // "Lunes"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  spaceId?: number;
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
}