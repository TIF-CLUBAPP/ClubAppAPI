// Estado de asistencia de un alumno en una clase.
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED';

// Alumno inscripto en una clase (GET /api/attendance/classes)
export interface ClassStudent {
  userId: number;
  fullName: string;
  email: string;
  status: AttendanceStatus;
  /** Fecha en la que se inscribió a la actividad (ISO). */
  enrollmentDate?: string | null;
  /** Estado actual de la inscripción: "ACTIVE" / "CANCELED". */
  enrollmentStatus?: string;
  /** Resumen histórico de asistencia en esta clase/schedule. */
  totalClasses?: number;
  presents?: number;
  absents?: number;
  justified?: number;
}

// Clase del día de un profesor con sus alumnos
export interface TeacherClass {
  activityId: number;
  activityName: string;
  activityScheduleId: number;
  startTime: string;
  endTime: string;
  students: ClassStudent[];
}

// Entrada para registrar asistencia (POST /api/attendance/mark)
export interface MarkAttendanceRequest {
  activityScheduleId: number;
  date: string;
  attendances: { userId: number; status: AttendanceStatus }[];
}