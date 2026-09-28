import { api } from './api';
import type { TeacherClass, MarkAttendanceRequest } from '../types/attendance';

export const attendanceService = {
  /** Clases del día del profesor (GET /api/attendance/classes?date=yyyy-MM-dd). */
  getClasses: async (date: string): Promise<TeacherClass[]> => {
    const response = await api.get<TeacherClass[]>('/attendance/classes', { params: { date } });
    return response.data;
  },

  /** Registra la asistencia de una clase (POST /api/attendance/mark). */
  markAttendance: async (data: MarkAttendanceRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/attendance/mark', data);
    return response.data;
  },
};