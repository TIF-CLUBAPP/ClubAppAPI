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
  remove: (id: string) => Promise<void>;
  resolveRequest: (notification: AppNotification, accept: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLLING_INTERVAL_MS = 12000; // Polling en segundo plano cada 12 segundos

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (showLoading) setLoading(true);

    try {
      const data = await notificationService.fetchAll();
      setNotifications(data);
    } catch {
      // Ignorar errores transitorios de conexión durante polling
    } finally {
      isFetchingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated]);

  // Carga inicial y polling continuo
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      void stopSignalRNotificationConnection();
      return;
    }

    // Consulta inicial al montar / autenticar
    void fetchNotifications(true);

    // Polling recurrente cada 12 segundos
    const intervalId = setInterval(() => {
      void fetchNotifications(false);
    }, POLLING_INTERVAL_MS);

    // Conexión WebSockets / SignalR para notificaciones en tiempo real
    if (token) {
      startSignalRNotificationConnection(token, () => {
        // Al recibir un evento SignalR, sincronizamos la lista inmediatamente
        void fetchNotifications(false);
      });
    }

    return () => {
      clearInterval(intervalId);
      void stopSignalRNotificationConnection();
    };
  }, [isAuthenticated, token, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Sin conexión con el backend
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await notificationService.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Sin conexión con el backend
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
    (n) => !n.read && (n.category === 'friend_request' || n.category === 'payment')
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
