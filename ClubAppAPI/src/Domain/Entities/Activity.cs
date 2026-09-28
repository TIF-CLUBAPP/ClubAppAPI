using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities;

public class Activity : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Categoría de la actividad (ej. "Deportes", "Fitness", "Natación").</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Precio de la actividad (0 = gratuita).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public int MaxCapacity { get; set; }

    /// <summary>Profesor a cargo. Null = la dicta el Club.</summary>
    public int? TeacherId { get; set; }
    public virtual User? Teacher { get; set; }

    /// <summary>Indica si la actividad requiere reserva previa de turno/espacio.</summary>
    public bool RequiresBooking { get; set; }

    public string Schedule { get; set; } = string.Empty; //Horario legible (resumen)

    public bool IsActive { get; set; } = true;

    public virtual ICollection<ActivitySchedule> Schedules { get; set; } = new List<ActivitySchedule>();

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

}

