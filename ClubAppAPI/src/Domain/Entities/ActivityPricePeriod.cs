using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities;

/// <summary>
/// Precio de una actividad válido a partir de un período concreto ("yyyy-MM").
/// Permite programar aumentos de Precio Socio / Precio No Socio para el mes siguiente
/// sin sobrescribir el precio vigente, de modo que las cuotas generadas en meses
/// futuros tomen automáticamente el nuevo valor actualizado.
/// </summary>
public class ActivityPricePeriod : BaseEntity
{
    public int ActivityId { get; set; }
    public virtual Activity Activity { get; set; } = null!;

    /// <summary>Período "yyyy-MM" desde el cual rige este precio.</summary>
    public string Period { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceMember { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceNonMember { get; set; }

    /// <summary>Fecha (UTC, 1° del mes de Period) desde la que aplica este precio.</summary>
    public DateTime EffectiveFromDate { get; set; }

    /// <summary>Fecha en que se registró la previsión de precio.</summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Usuario que programó el precio (si se pudo resolver del token).</summary>
    public int? ChangedByUserId { get; set; }
}
