import { api } from './api';
import type { 
  FeeSettings, 
  FeeSettingsHistoryEntry,
  ExemptionsResponse, 
  UserExemption, 
  RoleExemption, 
  PagedPaymentsResponse,
  PaymentFilter,
  RegisterPaymentRequest,
  Payment,
  UserCuota,
  RegisterTransferRequest,
  TransferPaymentResult,
  PendingTransfer
} from '../types/cuotas';
import type { PayoutConfig, SavePayoutConfigRequest } from '../types/payout';


/** Respuesta del backend al crear una orden de pago en Mercado Pago. */
export interface CreateOrderResponse {
  /** `init_point` (snake_case) que devuelve el backend actual. */
  init_point?: string;
  /** Variantes camelCase / sandbox por si cambia la serializaciÃ³n o el SDK. */
  initPoint?: string;
  sandboxInitPoint?: string;
  id?: string;
  message?: string;
}

/** Respuesta del backend al procesar un pago con tarjeta tokenizada. */
export interface CardPaymentResult {
  /** true si el pago fue aprobado y la cuota quedÃ³ registrada como pagada. */
  success: boolean;
  /** Estado devuelto por Mercado Pago: approved | pending | in_process | rejected | ... */
  status: string;
  /** Mensaje descriptivo para el usuario. */
  message: string;
  /** ID del pago en Mercado Pago (si se alcanzÃ³ a crear). */
  mercadoPagoPaymentId?: number | null;
  /** ID de la cuota registrada en el sistema. */
  paymentId?: number | null;
}

export const paymentsService = {
  // ========== CreaciÃ³n de orden de pago (Mercado Pago) ==========
  /** Crea una orden de pago en Mercado Pago (POST /api/payments/create-order). */
  createOrder: async (cuotaId: number | number[]): Promise<CreateOrderResponse> => {
    const cuotaIds = Array.isArray(cuotaId) ? cuotaId : [cuotaId];
    const response = await api.post<CreateOrderResponse>('/payments/create-order', { cuotaIds });
    return response.data;
  },

  // ========== Pago con tarjeta tokenizada (Mercado Pago) ==========
  /** Procesa el pago con tarjeta usando el token de Mercado Pago (POST /api/payments/pay-with-card). */
  payWithCard: async (cuotaId: number | number[], token: string): Promise<CardPaymentResult> => {
    const cuotaIds = Array.isArray(cuotaId) ? cuotaId : [cuotaId];
    const response = await api.post<CardPaymentResult>('/payments/pay-with-card', { cuotaIds, token });
    return response.data;
  },

  // ========== ConfiguraciÃ³n de cuotas ==========
  /** Obtener configuraciÃ³n actual de cuotas (GET /api/payments/settings) */
  getSettings: async (): Promise<FeeSettings> => {
    const response = await api.get<FeeSettings>('/payments/settings');
    return response.data;
  },

  /** Actualizar configuraciÃ³n de cuotas (PUT /api/payments/settings) */
  updateSettings: async (data: FeeSettings): Promise<FeeSettings> => {
    const response = await api.put<FeeSettings>('/payments/settings', data);
    return response.data;
  },

  /** Obtener historial de cambios de precios (GET /api/payments/settings/history) */
  getSettingsHistory: async (): Promise<FeeSettingsHistoryEntry[]> => {
    const response = await api.get<FeeSettingsHistoryEntry[]>('/payments/settings/history');
    return response.data;
  },

  // ========== Exenciones ==========
  /** Obtener todas las exenciones (GET /api/payments/exemptions) */
  getExemptions: async (): Promise<ExemptionsResponse> => {
    const response = await api.get<ExemptionsResponse>('/payments/exemptions');
    return response.data;
  },

  /** Alternar exenciÃ³n de un usuario (PUT /api/payments/exemptions/user/{userId}) */
  toggleUserExemption: async (userId: string, isExempt: boolean): Promise<UserExemption> => {
    // Backend expects: { IsExemptFromFees: boolean }
    const response = await api.put<UserExemption>(`/payments/exemptions/user/${userId}`, { IsExemptFromFees: isExempt });
    return response.data;
  },

  /** Alternar exenciÃ³n de un rol (PUT /api/payments/exemptions/role/{roleName}) */
  toggleRoleExemption: async (roleName: string, isExempt: boolean): Promise<RoleExemption> => {
    // Backend expects: { AreFeesExempt: boolean }
    const response = await api.put<RoleExemption>(`/payments/exemptions/role/${roleName}`, { AreFeesExempt: isExempt });
    return response.data;
  },

  // ========== Listado de pagos ==========
  /** Obtener lista de pagos con filtros (GET /api/payments) */
  getPayments: async (filter: PaymentFilter = {}): Promise<PagedPaymentsResponse> => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.search) params.append('search', filter.search);
    if (filter.period) params.append('period', filter.period);
    params.append('page', (filter.page ?? 1).toString());
    params.append('pageSize', (filter.pageSize ?? 20).toString());
    
    const response = await api.get<PagedPaymentsResponse>(`/payments?${params.toString()}`);
    return response.data;
  },

  // ========== Mis cuotas (usuario autenticado) ==========
  /** Obtener las cuotas del usuario autenticado con su ID real de BD (GET /api/payments/mine) */
  getMyCuotas: async (): Promise<UserCuota[]> => {
    const response = await api.get<UserCuota[]>('/payments/mine');
    return response.data;
  },

  // ========== Registro manual de pago ==========
  /** Registrar pago manual (POST /api/payments/register) */
  registerPayment: async (data: RegisterPaymentRequest): Promise<Payment> => {
    const response = await api.post<Payment>('/payments/register', data);
    return response.data;
  },

  // ========== Transferencia bancaria ==========
  /** Registrar una transferencia bancaria (POST /api/payments/register-transfer). */
  registerTransfer: async (data: RegisterTransferRequest, proofFile?: File | null): Promise<TransferPaymentResult> => {
    const formData = new FormData();
    const cuotaIds = data.cuotaIds?.length
      ? data.cuotaIds
      : data.cuotaId != null
        ? [data.cuotaId]
        : [];
    formData.append('cuotaIds', JSON.stringify(cuotaIds));
    formData.append('totalAmount', data.totalAmount.toString());
    formData.append('netAmount', data.netAmount.toString());
    formData.append('marketplaceFee', data.marketplaceFee.toString());
    if (data.referenceNumber) {
      formData.append('referenceNumber', data.referenceNumber);
    }
    if (proofFile) {
      formData.append('proofFile', proofFile);
    }
    const response = await api.post<TransferPaymentResult>('/payments/register-transfer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /** Transferencias pendientes de aprobaciÃ³n (GET /api/payments/transfers/pending). */
  getPendingTransfers: async (): Promise<PendingTransfer[]> => {
    const response = await api.get<PendingTransfer[]>('/payments/transfers/pending');
    return response.data;
  },

  // ========== Configuración de cobro (payout) ==========
  /** Configuración de cobro de la Institución (GET /api/settings/payout-config). */
  getPayoutConfig: async (): Promise<PayoutConfig> => {
    const response = await api.get<PayoutConfig>('/settings/payout-config');
    return response.data;
  },

  /** Guarda/víncula credenciales de Mercado Pago y alias del Club (POST /api/settings/payout-config). */
  savePayoutConfig: async (data: SavePayoutConfigRequest): Promise<PayoutConfig> => {
    const response = await api.post<PayoutConfig>('/settings/payout-config', data);
    return response.data;
  },

  // ========== Mercado Pago - OAuth (vinculación de cuenta) ==========
  /** Obtiene la URL de autorización OAuth para vincular la cuenta MP (POST /api/payments/mercadopago/connect). */
  connectMercadoPago: async (): Promise<{ authorizationUrl: string }> => {
    const response = await api.post<{ authorizationUrl: string }>('/payments/mercadopago/connect');
    return response.data;
  },
};

