import { api } from './api';
import type { UserListItem } from '../types/user';

export interface GetUsersParams {
  searchQuery?: string;
  role?: string;
  status?: string;
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
};
