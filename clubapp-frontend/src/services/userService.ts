import { api } from './api';
import type { UserListItem } from '../types/user';
import type { TeacherPayoutSettings, TeacherPayoutSettingsRequest, ProfilePaymentInfo } from '../types/payout';

export interface GetUsersParams {
  searchQuery?: string;
  role?: string;
  status?: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string;
}

export const userService = {
  /** Lista de socios con búsqueda/filtros opcionales (solo ADMIN/SUPERADMIN). */
  getUsers: async (params?: GetUsersParams): Promise<UserListItem[]> => {
    const response = await api.get<UserListItem[]>('/users', { params });
    return response.data;
  },

  /** Actualiza el rol de un usuario. `newRole` es el valor numérico del enum backend. */
  updateRole: async (id: number, newRole: number): Promise<{ message: string }> => {
    const response = await api.patch(`/users/${id}/role`, { newRole });
    return response.data;
  },

  /** Actualiza los datos personales del usuario logueado (PATCH /api/users/{id}/basic-info). */
  updateProfile: async (id: string | number, data: UpdateProfilePayload): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/users/${id}/basic-info`, data);
    return response.data;
  },

  /** Bloquea (isActive=false) o desbloquea (isActive=true) un usuario. */
  updateStatus: async (id: number, isActive: boolean): Promise<{ message: string }> => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  /** Elimina un usuario (soft delete en backend). */
  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // ========== Cobro directo de profesores (split payments) ==========
  /** Configuración de cobro directo de un profesor (GET /api/teachers/{id}/payout-settings). */
  getTeacherPayoutSettings: async (id: number): Promise<TeacherPayoutSettings> => {
    const response = await api.get<TeacherPayoutSettings>(`/teachers/${id}/payout-settings`);
    return response.data;
  },

  /** Permite/deniega el cobro directo y guarda los datos de cobro (PATCH /api/teachers/{id}/payout-settings). */
  updateTeacherPayoutSettings: async (
    id: number,
    data: TeacherPayoutSettingsRequest
  ): Promise<TeacherPayoutSettings> => {
    const response = await api.patch<TeacherPayoutSettings>(`/teachers/${id}/payout-settings`, data);
    return response.data;
  },

  // ========== Configuración de cobro del usuario autenticado ==========
  /** Configuración de cobro del usuario autenticado (GET /api/users/profile/payment-info). */
  getProfilePaymentInfo: async (): Promise<ProfilePaymentInfo> => {
    const response = await api.get<ProfilePaymentInfo>('/users/profile/payment-info');
    return response.data;
  },

  /** Guarda el Alias/CBU/CVU del usuario autenticado (PUT /api/users/profile/payment-info). */
  saveProfilePaymentInfo: async (bankAlias: string): Promise<ProfilePaymentInfo> => {
    const response = await api.put<ProfilePaymentInfo>('/users/profile/payment-info', { bankAlias });
    return response.data;
  },
};
