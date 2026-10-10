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
    public string PaymentCollector { get; set; } = "CLUB";
    public decimal ProfessorFacilityFeeMember { get; set; }
    public decimal ProfessorFacilityFeeNonMember { get; set; }
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
}

/// <summary>Profesor/administrador a cargo de una actividad (expuesto al frontend).</summary>
public class InstructorDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}