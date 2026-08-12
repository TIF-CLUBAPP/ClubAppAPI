// Configuración de cuotas (GET/PUT /api/payments/settings)
export interface FeeSettings {
  baseFeeAmount: number;
  lateFeePercentage: number;
  dueDayOfMonth: number;
}

// Exención de usuario (GET /api/payments/exemptions)
export interface UserExemption {
  UserId: number;
  FullName: string;
  Email: string;
  Role: string;
  IsExemptFromFees: boolean;
}

// Exención de rol (GET /api/payments/exemptions)
export interface RoleExemption {
  Role: string;
  AreFeesExempt: boolean;
  Description?: string;
}

// Respuesta completa de exenciones
export interface ExemptionsResponse {
  Roles: RoleExemption[];
  Users: UserExemption[];
}

// Pago para listado (GET /api/payments)
export interface Payment {
  id: number;
  userId: string;
  userName: string;
  period: string;
  amount: number;
  lateFeeApplied: number;
  totalAmount: number;
  paymentDate?: string;
  status: string;
  paymentMethod?: string;
}

// Respuesta paginada de pagos
export interface PagedPaymentsResponse {
  items: Payment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// DTO para registrar pago manual (POST /api/payments/register)
export interface RegisterPaymentRequest {
  userId: string;
  period: string;
  paymentMethod: string;
  amount: number;
}
