namespace ClubApp.Application.Dtos;

public class ActivityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int MaxCapacity { get; set; }
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
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