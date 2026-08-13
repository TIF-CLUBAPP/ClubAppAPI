import { api } from './api';
import type { 
  FeeSettings, 
  ExemptionsResponse, 
  UserExemption, 
  RoleExemption, 
  PagedPaymentsResponse,
  PaymentFilter,
  RegisterPaymentRequest,
  Payment
} from '../types/cuotas';

export const paymentsService = {
  // ========== Configuración de cuotas ==========
  /** Obtener configuración actual de cuotas (GET /api/payments/settings) */
  getSettings: async (): Promise<FeeSettings> => {
    const response = await api.get<FeeSettings>('/payments/settings');
    return response.data;
  },

  /** Actualizar configuración de cuotas (PUT /api/payments/settings) */
  updateSettings: async (data: FeeSettings): Promise<FeeSettings> => {
    const response = await api.put<FeeSettings>('/payments/settings', data);
    return response.data;
  },

  // ========== Exenciones ==========
  /** Obtener todas las exenciones (GET /api/payments/exemptions) */
  getExemptions: async (): Promise<ExemptionsResponse> => {
    const response = await api.get<ExemptionsResponse>('/payments/exemptions');
    return response.data;
  },

  /** Alternar exención de un usuario (PUT /api/payments/exemptions/user/{userId}) */
  toggleUserExemption: async (userId: string, isExempt: boolean): Promise<UserExemption> => {
    // Backend expects: { IsExemptFromFees: boolean }
    const response = await api.put<UserExemption>(`/payments/exemptions/user/${userId}`, { IsExemptFromFees: isExempt });
    return response.data;
  },

  /** Alternar exención de un rol (PUT /api/payments/exemptions/role/{roleName}) */
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

  // ========== Registro manual de pago ==========
  /** Registrar pago manual (POST /api/payments/register) */
  registerPayment: async (data: RegisterPaymentRequest): Promise<Payment> => {
    const response = await api.post<Payment>('/payments/register', data);
    return response.data;
  },
};