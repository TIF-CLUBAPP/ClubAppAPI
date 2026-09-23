/**
 * Configuración de Mercado Pago en el frontend.
 *
 * El flujo de pago actual es una redirección al `init_point` que devuelve el
 * backend (POST /api/payments/create-order). En ese flujo NO se usa el SDK ni
 * los Checkout Bricks en el navegador, por lo que la clave pública NO es
 * estrictamente necesaria.
 *
 * `VITE_MERCADOPAGO_PUBLIC_KEY` solo se requiere si en el futuro se integra el
 * SDK/Checkout en el navegador. Se lee con un fallback seguro (cadena vacía)
 * para no interrumpir el flujo si no está definida en el `.env`.
 */
const rawPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined;

export const MERCADOPAGO_PUBLIC_KEY: string = (rawPublicKey ?? '').trim();

export const hasMercadoPagoPublicKey = (): boolean => Boolean(MERCADOPAGO_PUBLIC_KEY);

if (!hasMercadoPagoPublicKey()) {
  console.warn(
    '[mercadopago] VITE_MERCADOPAGO_PUBLIC_KEY no está definida. ' +
      'El flujo actual (redirección a init_point) no la requiere; solo sería necesaria para el SDK/Checkout en el navegador.',
  );
}
