import { api } from './api';
import type { AppNotification, NotificationCategory } from '../types/notification';

/** Forma en que el backend expone una notificación (entidad `Notification`). */
interface BackendNotification {
  id: number;
  userId: number | null;
  title: string;
  message: string;
  category: string; // FriendRequest | Booking | Payment | System
  isRead: boolean;
  referenceId: string | null;
  createdAt: string;
  sentAt?: string;
}

/** Convierte la categoría del backend a la categoría usada por la UI. */
const mapCategory = (category: string): NotificationCategory => {
  switch (category) {
    case 'FriendRequest':
      return 'friend_request';
    case 'Booking':
      return 'rental';
    case 'Payment':
      return 'payment';
    default:
      return 'announcement';
  }
};

const mapNotification = (n: BackendNotification): AppNotification => ({
  id: String(n.id),
  category: mapCategory(n.category),
  title: n.title,
  description: n.message,
  createdAt: n.createdAt ?? n.sentAt ?? new Date().toISOString(),
  read: n.isRead,
  requestId: n.category === 'FriendRequest' && n.referenceId ? Number(n.referenceId) : undefined,
});

const sortByNewest = (items: AppNotification[]): AppNotification[] =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const notificationService = {
  /** Obtiene las notificaciones del usuario autenticado desde el backend. */
  fetchAll: async (): Promise<AppNotification[]> => {
    const response = await api.get<BackendNotification[]>('/notifications');
    return sortByNewest(response.data.map(mapNotification));
  },

  /** Marca una notificación individual como leída. */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${encodeURIComponent(id)}/read`);
  },

  /** Marca todas las notificaciones del usuario como leídas. */
  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  /** Elimina una notificación propia en el backend. */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${encodeURIComponent(id)}`);
  },
};
