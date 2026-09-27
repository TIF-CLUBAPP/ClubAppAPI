/**
 * Tipado mínimo del SDK v2 de Mercado Pago cargado vía
 * <script src="https://sdk.mercadopago.com/js/v2"></script>.
 * Expone `window.MercadoPago` y su método `createCardToken` para la
 * tokenización de tarjetas en el navegador.
 */
export {};

declare global {
  interface Window {
    MercadoPago?: {
      new (
        publicKey: string,
        options?: { locale?: string; advancedFraudPrevention?: boolean },
      ): MercadoPagoInstance;
    };
  }
}

interface MercadoPagoInstance {
  /**
   * Tokeniza los datos de la tarjeta en el cliente. Devuelve el token (id) que
   * luego se envía al backend para procesar el pago. Los números de tarjeta
   * nunca salen del navegador.
   */
  createCardToken(data: {
    cardNumber?: string;
    cardholderName?: string;
    cardExpirationMonth?: string;
    cardExpirationYear?: string;
    securityCode?: string;
    identificationType?: string;
    identificationNumber?: string;
  }): Promise<{ id: string; [key: string]: unknown }>;
}
