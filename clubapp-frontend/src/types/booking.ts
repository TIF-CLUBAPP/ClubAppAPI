// Reserva de espacio (cancha) expuesta por GET/POST /api/bookings
export interface Booking {
  id: number;
  resourceName: string;
  spaceId?: number | null;
  spaceName?: string | null;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string;
  status: string; // PendingPayment | PendingApproval | Confirmed | Cancelled
  paymentId?: number | null;
  amount: number;
  marketplaceFee: number;
  totalAmount: number;
  transferAlias: string;
  payoutCollector: string;
}

// Entrada para crear una reserva (POST /api/bookings)
export interface CreateBookingRequest {
  resourceName: string;
  spaceId?: number | null;
  startTime: string;
  endTime: string;
  amount: number;
}