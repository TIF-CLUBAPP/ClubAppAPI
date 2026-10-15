import { api } from './api';
import type { Activity, SaveActivityRequest, ActivitySettlement, MyEnrollment } from '../types/activity';

export const activityService = {
  /** Catálogo de actividades (GET /api/activities). */
  getActivities: async (): Promise<Activity[]> => {
    const response = await api.get<Activity[]>('/activities');
    return response.data;
  },

  /** Inscripciones del usuario autenticado (GET /api/enrollments/my). */
  getMyEnrollments: async (): Promise<MyEnrollment[]> => {
    const response = await api.get<MyEnrollment[]>('/enrollments/my');
    return response.data;
  },

  /** Inscribe al usuario autenticado en una actividad (POST /api/enrollments). */
  enroll: async (activityId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/enrollments', { activityId });
    return response.data;
  },

  /** Crea una actividad (POST /api/activities). */
  createActivity: async (data: SaveActivityRequest): Promise<Activity> => {
    const response = await api.post<Activity>('/activities', data);
    return response.data;
  },

  /** Actualiza una actividad (PUT /api/activities/{id}). */
  updateActivity: async (id: number, data: SaveActivityRequest): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/activities/${id}`, data);
    return response.data;
  },

  /** Elimina una actividad (DELETE /api/activities/{id}). */
  deleteActivity: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/activities/${id}`);
    return response.data;
  },

  /** Auto-asigna al usuario autenticado como profesor a cargo (POST /api/activities/{id}/assign-me). */
  assignMe: async (activityId: number): Promise<Activity> => {
    const response = await api.post<Activity>(`/activities/${activityId}/assign-me`);
    return response.data;
  },

  /** Obtiene la liquidación de una actividad (GET /api/activities/{id}/settlement). */
  getSettlement: async (activityId: number): Promise<ActivitySettlement> => {
    const response = await api.get<ActivitySettlement>(`/activities/${activityId}/settlement`);
    return response.data;
  },

};