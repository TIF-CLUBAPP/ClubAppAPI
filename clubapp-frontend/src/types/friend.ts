// Tipos para el sistema de amigos y solicitudes de amistad.
// El contrato de la API se describe en `src/services/friendService.ts`.

/** Estado de la relación entre el usuario logueado y otra persona. */
export type FriendRelation = 'none' | 'friends' | 'request_sent' | 'request_received';

/** Resumen mínimo de un usuario que se muestra en listas de amigos/búsqueda. */
export interface FriendUserSummary {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  isActive?: boolean;
}

/** Amistad confirmada entre el usuario logueado y `friend`. */
export interface Friend {
  /** Id de la relación de amistad. */
  id: number;
  friend: FriendUserSummary;
  /** Fecha en la que se confirmó la amistad (ISO). */
  since?: string;
}

export type FriendRequestDirection = 'received' | 'sent';
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

/** Solicitud de amistad vista desde el usuario logueado. */
export interface FriendRequest {
  id: number;
  direction: FriendRequestDirection;
  /** El otro usuario involucrado en la solicitud. */
  user: FriendUserSummary;
  status: FriendRequestStatus;
  createdAt: string;
}

/** Estado agregado de solicitudes pendientes (recibidas y enviadas). */
export interface FriendRequestsState {
  received: FriendRequest[];
  sent: FriendRequest[];
}

/** Resultado del buscador de personas con su estado de relación. */
export interface FriendSearchResult {
  user: FriendUserSummary;
  relation: FriendRelation;
  /** Id de la solicitud involucrada, si la hay. */
  requestId?: number | null;
}
