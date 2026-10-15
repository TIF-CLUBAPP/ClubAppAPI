import { api } from './api';
import type { Booking, CreateBookingRequest } from '../types/booking';

export const bookingService = {
  /** Disponibilidad por fecha (GET /api/bookings?date=yyyy-MM-dd). */
  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings', { params: { date } });
    return response.data;
  },

  /** Reservas del usuario autenticado (GET /api/bookings/mine). */
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings/mine');
    return response.data;
  },

  /** Crea una reserva y su pago asociado (POST /api/bookings). */
  createBooking: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await api.post<Booking>('/bookings', data);
    return response.data;
  },

  /** Confirma una reserva tras el pago aprobado (POST /api/bookings/{id}/confirm). */
  confirmBooking: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/bookings/${id}/confirm`);
    return response.data;
  },

  /** Cancela una reserva (DELETE /api/bookings/{id}). */
  cancelBooking: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/bookings/${id}`);
    return response.data;
  },
};