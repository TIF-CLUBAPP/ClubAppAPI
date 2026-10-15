using System;

namespace ClubApp.Application.Dtos;

/// <summary>
/// Regla de corte de servicio / suspensión de socio por mora
/// (GET /api/fee-settings/suspension-rules).
/// </summary>
public class SuspensionSettingsDto
{
    /// <summary>Meses de mora permitidos VIGENTES hoy.</summary>
    public int MaxOverdueMonths { get; set; }

    /// <summary>Monto máximo de deuda VIGENTE hoy.</summary>
    public decimal MaxOverdueAmount { get; set; }

    /// <summary>Condición de suspensión VIGENTE hoy ("OR" / "AND").</summary>
    public string SuspensionCondition { get; set; } = "OR";

    /// <summary>Meses de mora pendientes (aplicarán desde EffectiveFromDate). Null = sin cambio pendiente.</summary>
    public int? PendingMaxOverdueMonths { get; set; }

    /// <summary>Monto máximo de deuda pendiente. Null = sin cambio pendiente.</summary>
    public decimal? PendingMaxOverdueAmount { get; set; }

    /// <summary>Condición de suspensión pendiente ("OR"/"AND"). Null = sin cambio pendiente.</summary>
    public string? PendingSuspensionCondition { get; set; }

    /// <summary>Fecha (UTC, 1° del mes siguiente) desde la que rige la regla pendiente.</summary>
    public DateTime? EffectiveFromDate { get; set; }

    /// <summary>Fecha de la última modificación.</summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO de entrada para actualizar las reglas de suspensión por mora
/// (PUT /api/fee-settings/suspension-rules).
/// </summary>
public class UpdateSuspensionSettingsRequest
{
    public int MaxOverdueMonths { get; set; }

    public decimal MaxOverdueAmount { get; set; }

    public string SuspensionCondition { get; set; } = "OR";
}
