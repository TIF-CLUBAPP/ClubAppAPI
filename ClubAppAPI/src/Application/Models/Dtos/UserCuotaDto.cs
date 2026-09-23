namespace ClubApp.Application.Dtos;

/// <summary>
/// Cuota de un usuario con su ID numérico primario de base de datos (Payment.Id).
/// Devuelta por GET /api/payments/mine para que el frontend pueda pagar con el ID real.
/// </summary>
public class UserCuotaDto
{
    /// <summary>ID numérico primario del Payment (el que espera /api/payments/create-order).</summary>
    public int Id { get; set; }

    /// <summary>Período en formato ISO "yyyy-MM".</summary>
    public string Period { get; set; } = string.Empty;

    /// <summary>Monto base de la cuota.</summary>
    public decimal Amount { get; set; }

    /// <summary>Recargo por mora aplicado.</summary>
    public decimal LateFeeApplied { get; set; }

    /// <summary>Estado en texto: PENDING | PAID | OVERDUE | EXEMPT.</summary>
    public string Status { get; set; } = string.Empty;

    public DateTime? PaymentDate { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
