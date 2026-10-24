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

    /// <summary>Canon de instalaciones ($) acordado para la actividad (valor único consolidado).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal FacilityCanon { get; set; }

    /// <summary>Indica si se aplica descuento en el canon por cantidad de socios inscriptos.</summary>
    public bool AplicaDescuentoSocios { get; set; } = false;

    /// <summary>Tipo de descuento a aplicar: PORCENTAJE o MONTO_FIJO.</summary>
    public TipoDescuentoCanon TipoDescuentoCanon { get; set; } = TipoDescuentoCanon.MONTO_FIJO;

    /// <summary>Valor del descuento por cada socio inscripto (monto o porcentaje según TipoDescuentoCanon).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ValorDescuentoPorSocio { get; set; }

    /// <summary>Límite máximo de descuento total a aplicar sobre el canon (opcional).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? DescuentoMaximoCanon { get; set; }

    /// <summary>Estado de la negociación de precios/canon. Null = sin negociación; "PENDIENTE" o "APROBADO".</summary>
    public string? EstadoNegociacion { get; set; }

    /// <summary>Contraoferta de Precio Socio propuesta durante la negociación.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ProposedPriceMember { get; set; }

    /// <summary>Contraoferta de Canon de instalaciones propuesta durante la negociación.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ProposedFacilityCanon { get; set; }

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

