// Configuración de cuotas (GET/PUT /api/payments/settings)
export interface FeeSettings {
  baseFeeAmount: number;
  lateFeePercentage: number;
  lateFeeType: 'percentage' | 'fixed';
  dueDayOfMonth: number;
  /** Fecha ISO desde la que rige la tarifa actual. null = vigente desde siempre. */
  effectiveFromDate?: string | null;
  /** Fecha ISO (1° del mes siguiente) en la que entrará en vigencia el último cambio guardado. */
  pendingEffectiveFromDate?: string | null;
}

// Entrada del historial de precios (GET /api/payments/settings/history)
export interface FeeSettingsHistoryEntry {
  id: number;
  previousBaseFeeAmount: number;
  previousLateFeePercentage: number;
  previousDueDayOfMonth: number;
  newBaseFeeAmount: number;
  newLateFeePercentage: number;
  newDueDayOfMonth: number;
  effectiveFromDate: string;
  changedAt: string;
  changedByUserId?: number | null;
  notes?: string | null;
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

// Estado de la cuota / situación del socio en el padrón de deudores
export type EstadoCuota = 'EN_MORA' | 'PENDIENTE' | 'AL_DIA' | 'EXENTO';

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
  /** Porcentaje de exención aplicado al socio (0-100). 100 = no genera deuda. */
  exencionPorcentaje?: number;
  /** Porcentaje de mora aplicado sobre el subtotal bonificado (0-100). */
  moraPorcentaje?: number;
  /** Situación consolidada del socio para filtros y badges. */
  estadoCuota?: EstadoCuota;
  /** Motivo de la exención (ej. "Jubilado", "Staff"). */
  motivoExencion?: string;
}


export interface MemberCuota {
  id: string;
  /** ID numérico primario de la cuota (Payment.Id) en la base de datos. */
  idReal?: number;
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

// Cuota del usuario devuelta por el backend (GET /api/payments/mine)
export interface UserCuota {
  id: number;             // ID numérico primario (Payment.Id)
  period: string;         // "yyyy-MM"
  amount: number;         // monto base
  lateFeeApplied: number; // recargo por mora
  status: string;         // "PENDING" | "PAID" | "OVERDUE" | "EXEMPT"
  paymentDate?: string | null;
  paymentMethod?: string;
  createdAt: string;
}

