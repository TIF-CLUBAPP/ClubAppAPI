using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities;

public class Activity : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Categoría de la actividad (ej. "Deportes", "Fitness", "Natación").</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Precio de la actividad (obsoleto, usar PriceMember y PriceNonMember).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceMember { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceNonMember { get; set; }

    public PaymentCollectorType PaymentCollector { get; set; } = PaymentCollectorType.CLUB;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProfessorFacilityFeeMember { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProfessorFacilityFeeNonMember { get; set; }

    public string? ProfessorMercadoPagoPublicKey { get; set; }
    public string? ProfessorMercadoPagoAccessToken { get; set; }

    public int MaxCapacity { get; set; }

    /// <summary>Profesor a cargo. Null = la dicta el Club.</summary>
    public int? TeacherId { get; set; }
    public virtual User? Teacher { get; set; }

    /// <summary>Espacio físico donde se dicta la actividad (clave foránea a Space).</summary>
    public int? SpaceId { get; set; }
    public virtual Space? Space { get; set; }

    /// <summary>Indica si la actividad requiere reserva previa de turno/espacio.</summary>
    public bool RequiresBooking { get; set; }

    public string Schedule { get; set; } = string.Empty; //Horario legible (resumen)

    public bool IsActive { get; set; } = true;

    public virtual ICollection<ActivitySchedule> Schedules { get; set; } = new List<ActivitySchedule>();

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    /// <summary>Profesores/administradores a cargo de dictar esta actividad.</summary>
    public virtual ICollection<ActivityInstructor> Instructors { get; set; } = new List<ActivityInstructor>();

}

