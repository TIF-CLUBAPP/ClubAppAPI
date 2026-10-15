/**
 * Configuración de Mercado Pago en el frontend.
 *
 * La clave pública (VITE_MERCADOPAGO_PUBLIC_KEY) es necesaria para tokenizar
 * tarjetas en el navegador con el SDK v2 (`window.MercadoPago.createCardToken`).
 * El pago con "Mercado Pago" (Checkout Pro) sigue siendo una redirección al
 * `init_point` que devuelve el backend y NO usa la clave pública.
 */
const rawPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined;

export const MERCADOPAGO_PUBLIC_KEY: string = (rawPublicKey ?? '').trim();

export const hasMercadoPagoPublicKey = (): boolean => Boolean(MERCADOPAGO_PUBLIC_KEY);

/**
 * Devuelve una instancia del SDK v2 de Mercado Pago lista para tokenizar tarjetas.
 * Lanza un error descriptivo si falta la clave pública o el script del SDK.
 */
export const getMercadoPagoInstance = () => {
  if (!hasMercadoPagoPublicKey()) {
    throw new Error(
      'Falta VITE_MERCADOPAGO_PUBLIC_KEY. No se puede tokenizar la tarjeta de forma segura.',
    );
  }

  if (typeof window === 'undefined' || !window.MercadoPago) {
    throw new Error(
      'El SDK de Mercado Pago no está cargado. Verificá el script https://sdk.mercadopago.com/js/v2.',
    );
  }

  return new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY);
};
