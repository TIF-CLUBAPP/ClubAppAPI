import { api } from './api';
import type { Activity } from '../types/activity';

export const activityService = {
  /** Catálogo de actividades (GET /api/activities). */
  getActivities: async (): Promise<Activity[]> => {
    const response = await api.get<Activity[]>('/activities');
    return response.data;
  },

  /** Inscribe al usuario autenticado en una actividad (POST /api/enrollments). */
  enroll: async (activityId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/enrollments', { activityId });
    return response.data;
  },
};