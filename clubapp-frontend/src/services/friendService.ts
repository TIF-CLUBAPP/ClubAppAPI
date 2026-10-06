import { api } from './api';
import type {
  Friend,
  FriendRequest,
  FriendRequestsState,
  FriendSearchResult,
} from '../types/friend';

/**
 * Servicio del sistema de amigos y solicitudes de amistad.
 *
 * Contrato de API (a implementar en el backend ClubAppAPI):
 *   GET    /api/friends                       -> Friend[] (amigos confirmados)
 *   GET    /api/friends/requests              -> FriendRequestsState
 *   GET    /api/friends/search?query=         -> FriendSearchResult[]
 *   POST   /api/friends/requests              -> FriendRequest   (body: { targetUserId })
 *   POST   /api/friends/requests/{id}/accept  -> Friend
 *   POST   /api/friends/requests/{id}/reject  -> { message }
 *   DELETE /api/friends/requests/{id}         -> { message }     (cancelar enviada)
 *   DELETE /api/friends/{id}                  -> { message }     (eliminar amigo)
 */
export const friendService = {
  /** Amigos confirmados del usuario logueado. */
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get<Friend[]>('/friends');
    return response.data;
  },

  /** Solicitudes pendientes recibidas y enviadas. */
  getRequests: async (): Promise<FriendRequestsState> => {
    const response = await api.get<FriendRequestsState>('/friends/requests');
    return response.data;
  },

  /** Busca personas con su estado de relación respecto al usuario logueado. */
  search: async (query: string): Promise<FriendSearchResult[]> => {
    const response = await api.get<FriendSearchResult[]>('/friends/search', {
      params: { query },
    });
    return response.data;
  },

  /** Envía una solicitud de amistad. */
  sendRequest: async (targetUserId: number): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>('/friends/requests', { targetUserId });
    return response.data;
  },

  /** Acepta una solicitud recibida. */
  acceptRequest: async (id: number): Promise<Friend> => {
    const response = await api.post<Friend>(`/friends/requests/${id}/accept`);
    return response.data;
  },

  /** Rechaza una solicitud recibida. */
  rejectRequest: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/friends/requests/${id}/reject`);
    return response.data;
  },

  /** Cancela una solicitud enviada. */
  cancelRequest: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/friends/requests/${id}`);
    return response.data;
  },

  /** Elimina un amigo confirmado. */
  removeFriend: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/friends/${id}`);
    return response.data;
  },
};
