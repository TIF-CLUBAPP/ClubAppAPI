namespace ClubApp.Application.Dtos;

public class PaymentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int MembershipId { get; set; }

    /// <summary>Nombre completo del socio (para listados admin).</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>Período de la cuota (MM/yyyy o yyyy-MM).</summary>
    public string Period { get; set; } = string.Empty;

    /// <summary>Monto base de la cuota (neto, sin mora ni comisión).</summary>
    public decimal Amount { get; set; }

    /// <summary>Recargo por mora aplicado.</summary>
    public decimal LateFeeApplied { get; set; }

    /// <summary>Comisión ATRIO (MarketplaceFee) para auditoría/facturación.</summary>
    public decimal MarketplaceFee { get; set; }

    /// <summary>Total a abonar (base + mora + comisión).</summary>
    public decimal TotalAmount { get; set; }

    public string Method { get; set; } = "CASH";
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public DateTime PaymentDate { get; set; }
    public string? ExternalTransactionId { get; set; }

    /// <summary>Número de operación / comprobante de transferencia.</summary>
    public string? TransferReference { get; set; }

    /// <summary>URL/ruta del archivo de comprobante adjunto.</summary>
    public string? ReceiptUrl { get; set; }
}