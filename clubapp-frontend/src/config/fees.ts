/**
 * Configuración del costo por servicio digital ATRIO (cobros digitales).
 *
 * Debe mantenerse alineada con `ClubApp.Domain.Constants.ClubConfigDefaults`:
 *   - DefaultApplicationFeePercentage = 3.5m
 *   - DefaultMaxApplicationFeeAmount  = 1500m
 */
export const DIGITAL_SERVICE_FEE_PERCENTAGE = 3.5; // %
export const DIGITAL_SERVICE_FEE_MAX_AMOUNT = 1500; // ARS

/**
 * Calcula el costo del servicio digital ATRIO sobre un monto:
 * `min(monto * 3.5%, $1.500)`, redondeado a 2 decimales.
 */
export const computeDigitalServiceFee = (amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const raw = (amount * DIGITAL_SERVICE_FEE_PERCENTAGE) / 100;
  const capped = Math.min(raw, DIGITAL_SERVICE_FEE_MAX_AMOUNT);
  return Math.round(capped * 100) / 100;
};
