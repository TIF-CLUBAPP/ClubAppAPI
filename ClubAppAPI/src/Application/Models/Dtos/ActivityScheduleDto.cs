namespace ClubApp.Application.Dtos;

/// <summary>Horario de una actividad expuesto al frontend.</summary>
public class ActivityScheduleDto
{
    public int Id { get; set; }

    /// <summary>0 = Domingo ... 6 = Sábado.</summary>
    public int DayOfWeek { get; set; }

    /// <summary>Nombre del día en español (ej. "Lunes").</summary>
    public string DayName { get; set; } = string.Empty;

    /// <summary>Hora de inicio "HH:mm".</summary>
    public string StartTime { get; set; } = string.Empty;

    /// <summary>Hora de fin "HH:mm".</summary>
    public string EndTime { get; set; } = string.Empty;
}

/// <summary>Entrada de un horario al crear/actualizar una actividad.</summary>
public class ActivityScheduleInputDto
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty; // "HH:mm"
    public string EndTime { get; set; } = string.Empty;   // "HH:mm"
}

/// <summary>Entrada para crear/actualizar una actividad (POST/PUT /api/activities).</summary>
public class SaveActivityRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal PriceMember { get; set; }
    public decimal PriceNonMember { get; set; }
    public int DiaVencimiento { get; set; } = 10;
    public string TipoRecargoMora { get; set; } = "Ninguno";
    public decimal RecargoMoraSocio { get; set; }
    public decimal RecargoMoraNoSocio { get; set; }
    public string PaymentCollector { get; set; } = "CLUB";
    public decimal ProfessorFacilityFeeMember { get; set; }
    public decimal ProfessorFacilityFeeNonMember { get; set; }
    public decimal FacilityCanon { get; set; }
    public bool AplicaDescuentoSocios { get; set; } = false;
    public string TipoDescuentoCanon { get; set; } = "MONTO_FIJO";
    public decimal ValorDescuentoPorSocio { get; set; }
    public decimal? DescuentoMaximoCanon { get; set; }
    public string? EstadoNegociacion { get; set; }
    public decimal? ProposedPriceMember { get; set; }
    public decimal? ProposedFacilityCanon { get; set; }
    public string? ProfessorMercadoPagoPublicKey { get; set; }
    public string? ProfessorMercadoPagoAccessToken { get; set; }
    public int MaxCapacity { get; set; }
    public int? TeacherId { get; set; }

    /// <summary>IDs de los profesores/administradores a cargo de la actividad.</summary>
    public List<int> InstructorIds { get; set; } = new();

    public int? SpaceId { get; set; }
    public bool RequiresBooking { get; set; }
    public bool IsActive { get; set; } = true;
    public string Schedule { get; set; } = string.Empty;
    public List<ActivityScheduleInputDto> Schedules { get; set; } = new();
}

/// <summary>Contraoferta de negociación de precios/canon (POST /api/activities/{id}/negotiation/propose).</summary>
public class NegotiationProposalRequest
{
    public decimal? PriceMember { get; set; }
    public decimal? FacilityCanon { get; set; }
}

/// <summary>
/// Petición para que un instructor invitado acepte o rechace su asignación
/// (PATCH /api/activities/{activityId}/instructors/{teacherId}/status).
/// </summary>
public class InstructorStatusRequest
{
    /// <summary>"Accepted" o "Rejected".</summary>
    public string Status { get; set; } = "Accepted";
}

/// <summary>
/// Programa una actualización de Precio Socio / Precio No Socio a partir de un
/// Mes/Año determinados (POST /api/activities/{activityId}/price-updates).
/// </summary>
public class ScheduleActivityPriceRequest
{
    public decimal PriceMember { get; set; }
    public decimal PriceNonMember { get; set; }

    /// <summary>Año de vigencia (ej. 2026).</summary>
    public int Year { get; set; }

    /// <summary>Mes de vigencia 1-12 (ej. 12 = Diciembre).</summary>
    public int Month { get; set; }
}

/// <summary>Previsión de precio por período de una actividad.</summary>
public class ActivityPricePeriodDto
{
    public int Id { get; set; }
    public int ActivityId { get; set; }

    /// <summary>Período "yyyy-MM" desde el cual rige el precio.</summary>
    public string Period { get; set; } = string.Empty;

    public decimal PriceMember { get; set; }
    public decimal PriceNonMember { get; set; }
    public DateTime EffectiveFromDate { get; set; }
    public DateTime ChangedAt { get; set; }
    public int? ChangedByUserId { get; set; }
}