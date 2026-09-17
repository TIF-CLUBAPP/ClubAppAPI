// Configuración de cuotas (GET/PUT /api/payments/settings)
export interface FeeSettings {
  baseFeeAmount: number;
  lateFeePercentage: number;
  lateFeeType: 'percentage' | 'fixed';
  dueDayOfMonth: number;
}

// Exención de usuario (GET /api/payments/exemptions)
export interface UserExemption {
  UserId: number;
  FullName: string;
  Email: string;
  Role: string;
  IsExemptFromFees: boolean;
  dni?: string;
  category?: 'Discapacidad' | 'Jubilado' | 'Beca Social/Deportiva' | 'Socio Vitalicio' | 'Otro' | string;
  discountPercentage?: number; // 1 - 100%
  reason?: string; // Observaciones / Motivo
}

// Exención de rol (GET /api/payments/exemptions)
export interface RoleExemption {
  Role: string;
  AreFeesExempt: boolean;
  discountPercentage?: number; // 0 - 100%
  Description?: string;
  userCount?: number;
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

export interface PaymentFilter {
  status?: string;
  search?: string;
  period?: string;
  page?: number;
  pageSize?: number;
}


// Estadísticas de deuda
export interface CuotasVencidasStats {
  totalCuotasVencidas: number;
  montoTotalDeuda: number;
}

export interface CuotaVencida {
  socioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  cantidadCuotasImpagas: number;
  periodosVencidos: string[];
  montoTotalAdeudado: number;
  diasDeAtraso: number;
  paymentIds: number[];
  esAutoBloqueado: boolean;
  esBloqueadoManual: boolean;
  estaBloqueado: boolean;
}


export interface MemberCuota {
  id: string;
  periodo: string; // ej. "Septiembre 2026"
  mesAno: string; // ej. "2026-09"
  fechaVencimiento: string; // ej. "15/09/2026"
  baseAmount: number;
  discountPercentage: number;
  discountReason?: string;
  isOverdue: boolean;
  lateFeeAmount: number;
  lateFeeLabel?: string;
  totalAmount: number;
  status: 'PAGADA' | 'PENDIENTE' | 'EN_MORA';
  paidAt?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

