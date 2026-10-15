using System;
using System.Collections.Generic;

namespace ClubApp.Application.Dtos;

/// <summary>
/// Exención de cuota por rol (GET /api/fee-settings/role-exemptions).
/// Expresa el porcentaje de descuento aplicable a los socios de cada rol.
/// </summary>
public class RoleFeeExemptionDto
{
    /// <summary>Nombre del rol (ej. "MEMBER", "TEACHER", "ADMIN", "SUPERADMIN").</summary>
    public string RoleName { get; set; } = string.Empty;

    /// <summary>Porcentaje de exención VIGENTE hoy (0-100). 100 = exento total.</summary>
    public decimal DiscountPercentage { get; set; }

    /// <summary>Porcentaje de exención PENDIENTE. Null = sin cambio pendiente.</summary>
    public decimal? PendingDiscountPercentage { get; set; }

    /// <summary>Fecha (UTC, 1° del mes siguiente) desde la que regirá el porcentaje pendiente.</summary>
    public DateTime? EffectiveFromDate { get; set; }

    /// <summary>Fecha de la última modificación.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Descripción legible del rol (para la UI).</summary>
    public string? Description { get; set; }
}

/// <summary>
/// DTO de entrada para actualizar la política de exenciones por rol
/// (PUT /api/fee-settings/role-exemptions).
/// </summary>
public class UpdateRoleFeeExemptionsRequest
{
    /// <summary>Lista de exenciones con el nuevo porcentaje a aplicar desde el mes siguiente.</summary>
    public List<RoleFeeExemptionDto> Exemptions { get; set; } = new();
}
