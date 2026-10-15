// Tipos para el Pago Dividido / Reserva Grupal (dividir el pago entre amigos).

export type SplitPaymentMode = 'total' | 'split';

export type GroupParticipantStatus = 'PENDING' | 'PAID';

export interface GroupParticipant {
  /** ID único en el cliente (clave de React y mutaciones locales). */
  id: string;
  /** ID del usuario registrado en el sistema (si es socio). null = invitado sin cuenta. */
  userId?: number | null;
  name: string;
  email?: string;
  /** Username derivado (prefijo del email) o provisto por la búsqueda. */
  username?: string;
  /** true solo para el organizador de la reserva. */
  isOrganizer: boolean;
  /** Monto que debe pagar este participante (sin comisión). */
  shareAmount: number;
  status: GroupParticipantStatus;
  invitedAt?: string;
  paidAt?: string;
}

export interface GroupPaymentState {
  /** Número total de participantes (incluye al organizador). */
  totalParticipants: number;
  /** Hash/token único de la reserva grupal (para el link de pago). */
  token: string;
  /** Fecha límite de pago (ISO). */
  deadline: string;
  participants: GroupParticipant[];
}

// ============================================================
// DTOs espejo del backend (ClubAppAPI -> GroupBookingDtos.cs)
// ============================================================

export type GroupBookingStatus = 'Collecting' | 'Completed' | 'Expired';

export interface GroupParticipantDto {
  id: number;
  userId?: number | null;
  name: string;
  email?: string | null;
  isOrganizer: boolean;
  amount: number;
  status: string; // "PENDING" | "PAID"
  paidAt?: string | null;
}

export interface GroupBookingDto {
  id: number;
  token: string;
  resourceName: string;
  spaceId?: number | null;
  spaceName?: string | null;
  organizerUserId: number;
  organizerName: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  perPersonAmount: number;
  marketplaceFee: number;
  totalParticipants: number;
  paidCount: number;
  status: string; // "Collecting" | "Completed" | "Expired"
  expiresAt: string;
  completedAt?: string | null;
  transferAlias: string;
  participants: GroupParticipantDto[];
}

export interface GroupParticipantRequest {
  userId?: number | null;
  name: string;
  email?: string | null;
}

export interface InitGroupBookingRequest {
  resourceName: string;
  spaceId?: number | null;
  startTime: string;
  endTime: string;
  amount: number;
  totalParticipants: number;
  expiresInMinutes?: number;
  participants?: GroupParticipantRequest[];
}

export interface GroupPayRequest {
  participantId?: number | null;
  method?: string;
  transferReference?: string | null;
}
