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

  /** Crea la membresía del usuario autenticado y lo convierte en Socio activo (POST /api/memberships/subscribe). */
  subscribe: async (payload: SubscribeMembershipRequest): Promise<SubscribeMembershipResponse> => {
    const response = await api.post<SubscribeMembershipResponse>('/memberships/subscribe', payload);
    return response.data;
  },
};
