import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;
let currentToken: string | null = null;

export const startSignalRNotificationConnection = (
  token: string,
  onNotificationReceived: (notification: unknown) => void
): HubConnection | null => {
  // Si ya tenemos una conexión activa con el mismo token, no reiniciar
  if (connection && currentToken === token) {
    return connection;
  }

  // Si cambia el token o existe una conexión previa, detenerla
  if (connection) {
    void connection.stop();
    connection = null;
  }

  currentToken = token;

  const hubUrl = 'http://localhost:5236/hubs/notifications';

  connection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on('ReceiveNotification', (notification: unknown) => {
    onNotificationReceived(notification);
  });

  connection
    .start()
    .then(() => {
      // Conexión exitosa a SignalR Hub
    })
    .catch((err) => {
      console.warn('[SignalR Notifications] No se pudo conectar al hub en tiempo real:', err);
    });

  return connection;
};

export const stopSignalRNotificationConnection = async (): Promise<void> => {
  if (connection) {
    try {
      await connection.stop();
    } catch {
      // Ignorar errores al cerrar
    } finally {
      connection = null;
      currentToken = null;
    }
  }
};
