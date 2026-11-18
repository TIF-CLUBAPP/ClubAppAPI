using System;
using System.Collections.Generic;

namespace ClubApp.Application.Dtos;

/// <summary>
/// Resumen de aumentos programados para el mes siguiente que afectan al usuario
/// autenticado: su cuota social (si es socio) y sus actividades inscriptas.
/// Se usa para el banner informativo de "Mis Cuotas".
/// </summary>
public class UpcomingIncreasesDto
{
    /// <summary>Aumento programado de la cuota social (solo si corresponde). Null = sin aumento.</summary>
    public UpcomingFeeIncreaseDto? SocialFee { get; set; }

    /// <summary>Aumentos programados de actividades inscriptas.</summary>
    public List<UpcomingActivityIncreaseDto> Activities { get; set; } = new();
}

/// <summary>Aumento programado de la cuota social del club.</summary>
public class UpcomingFeeIncreaseDto
{
    /// <summary>Monto vigente hoy.</summary>
    public decimal CurrentAmount { get; set; }

    /// <summary>Monto que regirá desde EffectiveFromDate.</summary>
    public decimal NewAmount { get; set; }

    /// <summary>Período "yyyy-MM" de vigencia del nuevo monto.</summary>
    public string Period { get; set; } = string.Empty;

    public DateTime EffectiveFromDate { get; set; }
}

/// <summary>Aumento programado del precio de una actividad inscripta.</summary>
public class UpcomingActivityIncreaseDto
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;

    public decimal CurrentPriceMember { get; set; }
    public decimal CurrentPriceNonMember { get; set; }
    public decimal NewPriceMember { get; set; }
    public decimal NewPriceNonMember { get; set; }

    /// <summary>Período "yyyy-MM" de vigencia del nuevo precio.</summary>
    public string Period { get; set; } = string.Empty;

    public DateTime EffectiveFromDate { get; set; }
}
