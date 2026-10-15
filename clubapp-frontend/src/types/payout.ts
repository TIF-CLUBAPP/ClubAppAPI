// Configuración de cobro de la Institución (GET/POST /api/settings/payout-config)
export interface PayoutConfig {
  hasMercadoPagoAccessToken: boolean;
  mercadoPagoUserId?: string | null;
  bankAlias?: string | null;
  applicationFeePercentage: number;
  maxApplicationFeeAmount: number;
}

// Entrada para guardar/vincular credenciales y alias del Club.
export interface SavePayoutConfigRequest {
  mercadoPagoAccessToken?: string;
  mercadoPagoUserId?: string;
  bankAlias?: string;
}

// Configuración de cobro directo de un profesor (GET/PATCH /api/teachers/{id}/payout-settings)
export interface TeacherPayoutSettings {
  teacherId: number;
  allowsDirectPayment: boolean;
  bankAlias?: string | null;
  hasMercadoPagoAccessToken: boolean;
  mercadoPagoUserId?: string | null;
}

// Entrada para actualizar la configuración de cobro directo de un profesor.
export interface TeacherPayoutSettingsRequest {
  allowsDirectPayment: boolean;
  bankAlias?: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoUserId?: string;
}

// Configuración de cobro directo del usuario autenticado (GET/PUT /api/users/profile/payment-info)
export interface ProfilePaymentInfo {
  allowsDirectPayment: boolean;
  bankAlias?: string | null;
  hasMercadoPagoAccessToken: boolean;
  mercadoPagoUserId?: string | null;
}
