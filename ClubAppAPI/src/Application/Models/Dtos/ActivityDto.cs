namespace ClubApp.Application.Dtos;

public class ActivityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal PriceMember { get; set; }
    public decimal PriceNonMember { get; set; }

    /// <summary>Día del mes (1-28) hasta el cual se puede pagar sin recargo.</summary>
    public int DiaVencimiento { get; set; }

    /// <summary>Tipo de recargo por mora: "Ninguno" | "Porcentaje" | "MontoFijo".</summary>
    public string TipoRecargoMora { get; set; } = "Ninguno";

    /// <summary>Valor del recargo por mora para Socios (% o $).</summary>
    public decimal RecargoMoraSocio { get; set; }

    /// <summary>Valor del recargo por mora para No Socios (% o $).</summary>
    public decimal RecargoMoraNoSocio { get; set; }

    public string PaymentCollector { get; set; } = "CLUB";
    public decimal ProfessorFacilityFeeMember { get; set; }
    public decimal ProfessorFacilityFeeNonMember { get; set; }
    public decimal FacilityCanon { get; set; }
    public bool AplicaDescuentoSocios { get; set; }
    public string TipoDescuentoCanon { get; set; } = "MONTO_FIJO";
    public decimal ValorDescuentoPorSocio { get; set; }
    public decimal? DescuentoMaximoCanon { get; set; }
    public string? EstadoNegociacion { get; set; }
    public decimal? ProposedPriceMember { get; set; }
    public decimal? ProposedFacilityCanon { get; set; }
    public string? ProfessorMercadoPagoPublicKey { get; set; }

    /// <summary>Alias/CBU/CVU del profesor que cobra directamente (solo PROFESSOR_DIRECT).</summary>
    public string? ProfessorBankAlias { get; set; }

    /// <summary>True si el profesor tiene una cuenta de Mercado Pago vinculada.</summary>
    public bool ProfessorHasMercadoPago { get; set; }

    /// <summary>Identificador de la cuenta de Mercado Pago del profesor (si está vinculada).</summary>
    public string? ProfessorMercadoPagoUserId { get; set; }
    public int MaxCapacity { get; set; }
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }

    /// <summary>Tipo del profesor a cargo: "CLUB" o "INDEPENDIENTE" (null si no hay profesor).</summary>
    public string? TeacherTipoProfesor { get; set; }

    /// <summary>Profesores/administradores a cargo de dictar la actividad.</summary>
    public List<InstructorDto> Instructors { get; set; } = new();

    public int? SpaceId { get; set; }
    public string? SpaceName { get; set; }
    public bool RequiresBooking { get; set; }
    public string Schedule { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    /// <summary>Horarios estructurados de la actividad.</summary>
    public List<ActivityScheduleDto> Schedules { get; set; } = new();

    /// <summary>Inscripciones activas (cupos ocupados).</summary>
    public int EnrolledCount { get; set; }

    /// <summary>Cupos disponibles (negativo si está sobrecargada).</summary>
    public int AvailableSpots => MaxCapacity - EnrolledCount;

    /// <summary>Precio Socio programado para el próximo período. Null = sin cambio pendiente.</summary>
    public decimal? PendingPriceMember { get; set; }

    /// <summary>Precio No Socio programado para el próximo período. Null = sin cambio pendiente.</summary>
    public decimal? PendingPriceNonMember { get; set; }

    /// <summary>Período "yyyy-MM" del aumento pendiente (si existe).</summary>
    public string? PendingPricePeriod { get; set; }

    /// <summary>Fecha (UTC, 1° del mes) desde la que rige el precio pendiente.</summary>
    public DateTime? PendingPriceEffectiveFromDate { get; set; }
}

/// <summary>Profesor/administrador a cargo de una actividad (expuesto al frontend).</summary>
public class InstructorDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>Estado de la asignación del instructor (Pending/Accepted/Rejected).</summary>
    public string Status { get; set; } = "Accepted";

    /// <summary>Fecha en que se envió la invitación (UTC). Solo relevante para los pendientes.</summary>
    public DateTime? InvitedAt { get; set; }
}