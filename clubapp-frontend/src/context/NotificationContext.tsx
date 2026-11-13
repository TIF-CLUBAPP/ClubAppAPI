import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { AppNotification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { friendService } from '../services/friendService';
import { useAuth } from './AuthContext';
import {
  startSignalRNotificationConnection,
  stopSignalRNotificationConnection,
} from '../services/notificationSignalR';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  hasActionableUnread: boolean;
  loading: boolean;
  actingId: number | null;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  resolveRequest: (notification: AppNotification, accept: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissedIdsRef = useRef(dismissedIds);
  dismissedIdsRef.current = dismissedIds;

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (showLoading) setLoading(true);

    try {
      const data = await notificationService.fetchAll();
      const filtered = data.filter(n => {
        const strId = String(n.id);
        if (dismissedIdsRef.current.includes(strId)) return false;
        const textToCheck = `${n.title} ${n.description}`.toLowerCase();
        if (textToCheck.includes('membresía registrada') || textToCheck.includes('membresia registrada')) {
          return false;
        }
        return true;
      });
      setNotifications(filtered);
    } catch {
      // Ignorar errores transitorios de conexión
    } finally {
      isFetchingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated]);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  // Carga inicial al autenticar y conexión en tiempo real vía SignalR (SIN POLLING / SIN INTERVALOS)
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      void stopSignalRNotificationConnection();
      return;
    }

    // Consulta inicial al montar / autenticar
    void fetchNotificationsRef.current(true);

    // Conexión WebSockets / SignalR para notificaciones en tiempo real
    if (tokenRef.current) {
      startSignalRNotificationConnection(tokenRef.current, () => {
        // Al recibir un evento SignalR, sincronizamos la lista inmediatamente
        void fetchNotificationsRef.current(false);
      });
    }

    return () => {
      void stopSignalRNotificationConnection();
    };
  }, [isAuthenticated]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Sin conexión con el backend
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    const strId = String(id);
    // Marcamos como leída localmente de inmediato (feedback instantáneo).
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === strId ? { ...n, read: true } : n)),
    );
    try {
      await notificationService.markAsRead(strId);
    } catch {
      // Sin conexión con el backend; el estado local ya quedó actualizado.
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const strId = String(id);
    // 1. Borra la notificación del estado local inmediatamente de forma infalible
    setNotifications(prev => prev.filter(n => String(n.id) !== strId));
    // 2. Registrar en dismissedIds y persistir en localStorage para ocultamiento forzoso permanente
    setDismissedIds(prev => {
      if (prev.includes(strId)) return prev;
      const next = [...prev, strId];
      try {
        localStorage.setItem('dismissed_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      // 3. Haz el await notificationService.remove(id) sin re-fetch
      await notificationService.remove(id);
    } catch (err) {
      console.warn("No se pudo sincronizar el borrado en servidor:", err);
    }
  }, []);

  const resolveRequest = useCallback(async (notification: AppNotification, accept: boolean) => {
    if (!notification.requestId) return;
    setActingId(notification.requestId);
    try {
      if (accept) {
        await friendService.acceptRequest(notification.requestId);
      } else {
        await friendService.rejectRequest(notification.requestId);
      }
      await remove(notification.id);
    } finally {
      setActingId(null);
    }
  }, [remove]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasActionableUnread = notifications.some(
    (n) => !n.read && (n.category === 'friend_request' || n.category === 'payment' || n.category === 'activity_invitation')
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasActionableUnread,
        loading,
        actingId,
        refresh: () => fetchNotifications(false),
        markAllRead,
        markRead,
        remove,
        resolveRequest,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
};
