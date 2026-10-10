namespace ClubApp.Application.Dtos;

/// <summary>
/// Entrada para registrar una transferencia bancaria (POST /api/payments/register-transfer).
/// El frontend envía el ID de la cuota, los montos y el comprobante; el backend recalcula
/// la comisión ATRIO de forma autoritativa para auditoría.
/// </summary>
public class RegisterTransferRequest
{
    /// <summary>ID de la cuota (pago individual).</summary>
    public int CuotaId { get; set; }

    /// <summary>IDs de las cuotas a abonar en una misma operación (pago agrupado).</summary>
    public List<int>? CuotaIds { get; set; }

    /// <summary>Total que abona el socio (base + comisión).</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Monto neto que recibe el club (base + mora).</summary>
    public decimal NetAmount { get; set; }

    /// <summary>Comisión ATRIO calculada en el cliente (se revalida en el servidor).</summary>
    public decimal MarketplaceFee { get; set; }

    /// <summary>Número de operación / referencia del comprobante de transferencia.</summary>
    public string? ReferenceNumber { get; set; }
    public string? ReceiptUrl { get; set; }

}

/// <summary>
/// Resultado del registro de una transferencia bancaria.
/// </summary>
public class TransferPaymentResult
{
    public bool Success { get; set; }

    /// <summary>PENDING | NOT_FOUND | ALREADY_PAID.</summary>
    public string Status { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    /// <summary>ID de la cuota (Payment.Id) registrada.</summary>
    public int? PaymentId { get; set; }

    public decimal NetAmount { get; set; }
    public decimal MarketplaceFee { get; set; }
    public decimal TotalAmount { get; set; }
}
