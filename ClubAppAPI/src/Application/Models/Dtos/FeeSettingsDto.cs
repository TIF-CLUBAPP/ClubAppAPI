using System;

namespace ClubApp.Application.Dtos;

/// <summary>
/// Configuración de cuotas (GET/PUT /api/payments/settings)
/// </summary>
public class FeeSettingsDto
{
    public decimal BaseFeeAmount { get; set; }
    public decimal LateFeePercentage { get; set; }
    public int DueDayOfMonth { get; set; }

    /// <summary>Fecha (UTC) desde la que rige la tarifa actual. Null = vigente desde siempre.</summary>
    public DateTime? EffectiveFromDate { get; set; }

    /// <summary>
    /// Fecha (UTC, 1° del mes siguiente) en la que comenzará a regir la tarifa pendiente,
    /// si el último cambio guardado todavía no entró en vigencia.
    /// </summary>
    public DateTime? PendingEffectiveFromDate { get; set; }
}

/// <summary>
/// DTO para actualizar configuración de cuotas (PUT /api/payments/settings)
/// </summary>
public class UpdateFeeSettingsDto
{
    public decimal BaseFeeAmount { get; set; }
    public decimal LateFeePercentage { get; set; }
    public int DueDayOfMonth { get; set; }
}

/// <summary>
/// Entrada del historial de precios (GET /api/payments/settings/history)
/// </summary>
public class FeeSettingsHistoryDto
{
    public int Id { get; set; }
    public decimal PreviousBaseFeeAmount { get; set; }
    public decimal PreviousLateFeePercentage { get; set; }
    public int PreviousDueDayOfMonth { get; set; }
    public decimal NewBaseFeeAmount { get; set; }
    public decimal NewLateFeePercentage { get; set; }
    public int NewDueDayOfMonth { get; set; }
    public DateTime EffectiveFromDate { get; set; }
    public DateTime ChangedAt { get; set; }
    public int? ChangedByUserId { get; set; }
    public string? Notes { get; set; }
}