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
    public string PaymentCollector { get; set; } = "CLUB";
    public decimal ProfessorFacilityFeeMember { get; set; }
    public decimal ProfessorFacilityFeeNonMember { get; set; }
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