import type { Reservation } from '../types/reservation';

const STORAGE_KEY = 'clubapp_reservations';

// Cargar reservas iniciales o del localStorage
export const getReservations = (): Reservation[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialMock: Reservation[] = [
      {
        id: 'res-1',
        courtId: 'c1',
        userEmail: 'socio@club.com',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '09:00',
        bufferEndTime: '09:15',
        status: 'confirmed',
      },
      {
        id: 'res-2',
        courtId: 'c3',
        userEmail: 'admin@club.com',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:45',
        endTime: '11:45',
        bufferEndTime: '12:00',
        status: 'confirmed',
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMock));
    return initialMock;
  }
  return JSON.parse(data);
};

// Agregar una nueva reserva
export const saveReservation = (newRes: Omit<Reservation, 'id' | 'status'>): Reservation => {
  const reservations = getReservations();
  const created: Reservation = {
    ...newRes,
    id: `res-${Date.now()}`,
    status: 'confirmed',
  };
  
  const updated = [...reservations, created];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return created;
};

// Cancelar una reserva
export const cancelReservation = (id: string): void => {
  const reservations = getReservations();
  const updated = reservations.map((res) =>
    res.id === id ? { ...res, status: 'cancelled' as const } : res
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// Verificar si una cancha está ocupada en cierta fecha y hora
export const isCourtBooked = (courtId: string, date: string, startTime: string): boolean => {
  const reservations = getReservations();
  return reservations.some(
    (res) => res.courtId === courtId && res.date === date && res.startTime === startTime && res.status === 'confirmed'
  );
};