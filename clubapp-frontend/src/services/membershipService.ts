import { api } from './api';
import type { FeeSettings } from '../types/cuotas';

/** Categorías de socio disponibles para la suscripción digital al club. */
export interface MembershipCategory {
  /** Identificador estable enviado al backend (ej. "SOCIO_ACTIVO"). */
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  /** Marca la opción recomendada. */
  highlight?: boolean;
}

/** 
 * Catálogo base de membresías con fallback seguro (ej. 150 o 15000) 
 * para garantizar renderizado inmediato sin mostrar "No disponible".
 */
export const MEMBERSHIP_CATEGORIES: MembershipCategory[] = [
  {
    id: 'SOCIO_ACTIVO',
    name: 'Socio Activo',
    price: 150, // Fallback seguro inicial
    description: 'Acceso completo a instalaciones y actividades del club con la cuota social oficial.',
    features: [
      'Acceso a reservas de espacios y canchas',
      'Descuentos exclusivos en actividades y torneos',
      'Gestión unificada de cuotas sociales desde la app',
    ],
    highlight: true,
  },
];

export interface SubscribeMembershipRequest {
  membershipType: string;
  monthlyPrice: number;
}

export interface SubscribeMembershipResponse {
  membershipId: number;
  status: string;
  membershipType: string;
  monthlyPrice: number;
  isSocio: boolean;
  /** Fecha de vencimiento del período vigente (null si no aplica). */
  nextDueDate?: string;
}

export const membershipService = {
  /** Obtiene la tarifa oficial vigente desde el backend (GET /api/payments/settings) con fallback transparente de 150. */
  getOfficialMonthlyPrice: async (): Promise<number> => {
    try {
      const response = await api.get<FeeSettings>('/payments/settings');
      if (response.data && typeof response.data.baseFeeAmount === 'number' && response.data.baseFeeAmount > 0) {
        return response.data.baseFeeAmount;
      }
    } catch {
      // Silencioso: usa fallback transparente
    }
    return 150;
  },

  /** Obtiene la membresía actual del usuario (GET /api/memberships/me). */
  getMyMembership: async (): Promise<SubscribeMembershipResponse | null> => {
    try {
      const response = await api.get<SubscribeMembershipResponse>('/memberships/me');
      return response.data;
    } catch {
      return null;
    }
  },


  /** Crea la membresía del usuario autenticado y lo convierte en Socio activo (POST /api/memberships/subscribe). */
  subscribe: async (payload: SubscribeMembershipRequest): Promise<SubscribeMembershipResponse> => {
    const response = await api.post<SubscribeMembershipResponse>('/memberships/subscribe', payload);
    return response.data;
  },

  /** Cancela la membresía actual del usuario (POST /api/memberships/cancel o DELETE /api/memberships/me). */
  cancelSubscription: async (): Promise<CancelSubscriptionResponse> => {
    const response = await api.post<CancelSubscriptionResponse>('/memberships/cancel');
    return response.data;
  },

  /** Reactiva una membresía cancelada con beneficios vigentes (POST /api/memberships/reactivate). */
  reactivateSubscription: async (): Promise<ReactivationResponse> => {
    const response = await api.post<ReactivationResponse>('/memberships/reactivate');
    return response.data;
  },
};

/** Respuesta del endpoint de cancelación: estado actualizado del usuario para reflejarlo sin recargar. */
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  /** Estado final del usuario: rol y condición de socio ya actualizados en la base de datos. */
  user?: {
    role?: string;
    isSocio?: boolean;
  };
  membershipStatus?: string;
}

/** Respuesta del endpoint de reactivación: membresía devuelta a ACTIVE sin cuota nueva. */
export interface ReactivationResponse {
  success: boolean;
  message: string;
  /** Estado final del usuario: rol y condición de socio ya actualizados en la base de datos. */
  user?: {
    role?: string;
    isSocio?: boolean;
  };
  membershipStatus?: string;
  /** Fecha de vencimiento del período vigente (ya abonado). */
  nextDueDate?: string;
}
