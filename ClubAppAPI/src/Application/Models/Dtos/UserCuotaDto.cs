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

    /// <summary>Concepto de la cuota: "CuotaSocial" | "Actividad".</summary>
    public string Concepto { get; set; } = "CuotaSocial";

    /// <summary>ID de la actividad asociada (solo cuotas de actividad).</summary>
    public int? ActivityId { get; set; }

    /// <summary>Nombre de la actividad asociada (solo cuotas de actividad).</summary>
    public string? ActivityName { get; set; }

    /// <summary>Fecha de vencimiento propia de la cuota de actividad (ISO). Null para cuota social.</summary>
    public DateTime? DueDate { get; set; }

    public DateTime? PaymentDate { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    /// <summary>Alias / CBU / CVU que debe mostrarse en el checkout de transferencia.</summary>
    public string TransferAlias { get; set; } = string.Empty;

    /// <summary>Receptor final del cobro (\"Club\" o el nombre del profesor).</summary>
    public string PayoutCollector { get; set; } = string.Empty;

    /// <summary>Regla de mora: "Ninguno" | "Porcentaje" | "MontoFijo". Para cuota social siempre "Porcentaje".</summary>
    public string? TipoRecargoMora { get; set; }

    /// <summary>Valor del recargo aplicable a este usuario (% si Porcentaje, $ si MontoFijo).</summary>
    public decimal? RecargoMoraValor { get; set; }
}
