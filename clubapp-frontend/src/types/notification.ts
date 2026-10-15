// Tipos para el centro de notificaciones del header.

export type NotificationCategory =
  | 'friend_request' // Solicitudes de amistad
  | 'rental' // Alquiler de canchas / reservas
  | 'payment' // Pagos grupales / cuotas pendientes
  | 'announcement'; // Actividades / avisos del club

export interface AppNotification {
  /** Identificador estable derivado de la fuente (ej. `friend-3`). */
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  /** Fecha ISO. */
  createdAt: string;
  /** `true` cuando el usuario ya la marcó como leída. */
  read: boolean;
  /** Id de la solicitud de amistad (solo para `friend_request`). */
  requestId?: number;
  /** Nombre del actor involucrado (solo para `friend_request`). */
  actorName?: string;
}
