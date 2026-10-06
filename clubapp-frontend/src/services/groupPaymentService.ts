import { api } from './api';
import { friendService } from './friendService';
import type {
  GroupBookingDto,
  GroupParticipant,
  GroupPayRequest,
  InitGroupBookingRequest,
} from '../types/groupPayment';
import type { Friend } from '../types/friend';

const usernameOf = (email: string): string => (email ? email.split('@')[0] : '');

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const toParticipantFromFriend = (f: Friend): GroupParticipant => ({
  id: `user-${f.friend.id}`,
  userId: f.friend.id,
  name: f.friend.fullName || `${f.friend.firstName} ${f.friend.lastName}`.trim(),
  email: f.friend.email,
  username: usernameOf(f.friend.email),
  isOrganizer: false,
  shareAmount: 0,
  status: 'PENDING',
});

export const groupPaymentService = {
  /** Crea la reserva grupal y cobra la cuota inicial del organizador (POST /api/bookings/group/init). */
  initGroupBooking: async (data: InitGroupBookingRequest): Promise<GroupBookingDto> => {
    const response = await api.post<GroupBookingDto>('/bookings/group/init', data);
    return response.data;
  },

  /** Obtiene el estado actualizado del grupo (GET /api/bookings/group/{token}). */
  getGroupBooking: async (token: string): Promise<GroupBookingDto> => {
    const response = await api.get<GroupBookingDto>(
      `/bookings/group/${encodeURIComponent(token)}`,
    );
    return response.data;
  },

  /** Registra el pago de la cuota de un participante (POST /api/bookings/group/{token}/pay). */
  payGroupShare: async (token: string, data: GroupPayRequest = {}): Promise<GroupBookingDto> => {
    const response = await api.post<GroupBookingDto>(
      `/bookings/group/${encodeURIComponent(token)}/pay`,
      data,
    );
    return response.data;
  },

  /** Construye el link absoluto de pago para un token. */
  buildPaymentLink: (token: string): string => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/pago-grupal?token=${encodeURIComponent(token)}`;
  },

  /** Construye el link de compartir por WhatsApp con el link de pago embebido. */
  buildWhatsAppLink: (token: string, amountLabel: string): string => {
    const link = groupPaymentService.buildPaymentLink(token);
    const text = `¡Sumate a la reserva grupal! 💪 Pagá tu parte (${amountLabel}) acá: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  },

  /** Busca únicamente entre los amigos confirmados del usuario logueado. */
  searchFriends: async (query: string): Promise<GroupParticipant[]> => {
    const term = normalize(query.trim());
    if (!term) return [];

    const friends = await friendService.getFriends();
    return friends
      .filter((f) => {
        const haystack = normalize(
          `${f.friend.fullName} ${f.friend.email} ${usernameOf(f.friend.email)}`,
        );
        return haystack.includes(term);
      })
      .slice(0, 6)
      .map(toParticipantFromFriend);
  },

};
