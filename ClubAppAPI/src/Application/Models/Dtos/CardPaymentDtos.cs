namespace ClubApp.Application.Dtos;

/// <summary>
/// Entrada para procesar el pago con tarjeta tokenizada (POST /api/payments/pay-with-card).
/// Solo se envía el token devuelto por Mercado Pago; los datos de la tarjeta
/// nunca llegan al backend.
/// </summary>
public class PayWithCardRequest
{
    public int CuotaId { get; set; }
    public string Token { get; set; } = string.Empty;
}

/// <summary>
/// Resultado del procesamiento del pago con tarjeta vía SDK de Mercado Pago.
/// </summary>
public class CardPaymentResult
{
    /// <summary>true si el pago fue aprobado y la cuota quedó registrada como pagada.</summary>
    public bool Success { get; set; }

    /// <summary>Estado devuelto por Mercado Pago: approved | pending | in_process | rejected | ...</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Mensaje descriptivo para el usuario.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>ID del pago en Mercado Pago (si se alcanzó a crear).</summary>
    public long? MercadoPagoPaymentId { get; set; }

    /// <summary>ID de la cuota (Payment.Id) registrada en el sistema.</summary>
    public int? PaymentId { get; set; }
}
