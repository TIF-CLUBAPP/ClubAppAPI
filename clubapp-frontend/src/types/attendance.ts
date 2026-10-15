// Alumno inscripto en una clase (GET /api/attendance/classes)
export interface ClassStudent {
  userId: number;
  fullName: string;
  email: string;
  present: boolean;
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
  attendances: { userId: number; present: boolean }[];
}