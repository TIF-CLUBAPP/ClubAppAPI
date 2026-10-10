import type { MemberCuota } from '../types/cuotas';

/**
 * Resuelve el ID numérico primario (Payment.Id) de una cuota para usarlo como
 * clave de selección y para las llamadas a la pasarela de pago.
 *
 * Prioriza `idReal` (ID de base de datos) y, si no está disponible (cuotas de
 * fallback/demo), extrae los dígitos del `id` string como último recurso.
 */
export const cuotaNumericId = (cuota: MemberCuota): number => {
  const raw = (cuota as { idReal?: number }).idReal;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;

  const digits = String(cuota.id ?? '').replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 0 : parsed;
};
