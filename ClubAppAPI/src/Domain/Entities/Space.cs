using System.Collections.Generic;

namespace ClubApp.Domain.Entities;

/// <summary>
/// Espacio físico del club (cancha, salón, pileta, etc.) sobre el que se
/// dictan actividades y se realizan reservas particulares.
/// </summary>
public class Space : BaseEntity
{
    /// <summary>Nombre del espacio (ej. "Cancha 1 - Polvo").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Deporte principal (Fútbol, Tenis, Pádel, Básquet, Gym, Pileta, etc.).</summary>
    public string SportCategory { get; set; } = string.Empty;

    /// <summary>Ubicación / sector del espacio (ej. "Predio Norte").</summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>Estado del espacio (activo o en mantenimiento).</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Si es false, se bloquean las reservas particulares cuando hay una
    /// clase/actividad programada en este espacio para el mismo horario.
    /// </summary>
    public bool AllowReservationsDuringClasses { get; set; } = false;

    /// <summary>
    /// Si es true, las reservas de este espacio por parte de socios requieren
    /// aprobación manual de un administrador antes de confirmarse.
    /// </summary>
    public bool RequiresApproval { get; set; } = false;

    /// <summary>
    /// Si es true, permite que dos actividades del mismo deporte/categoría
    /// compartan este espacio en el mismo horario. Deportes distintos nunca
    /// pueden superponerse.
    /// </summary>
    public bool PermitirSuperposicion { get; set; }

    /// <summary>Precio por turno/hora de alquiler particular.</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Duración de cada turno en minutos (ej. 60, 90, 120).</summary>
    public int SlotDurationMinutes { get; set; } = 60;

    /// <summary>Si es true, está disponible las 24hs para reservas.</summary>
    public bool Is24Hours { get; set; } = false;

    /// <summary>Hora de inicio de disponibilidad (ej. "08:00").</summary>
    public string? OpenTime { get; set; }

    /// <summary>Hora de fin de disponibilidad (ej. "23:00").</summary>
    public string? CloseTime { get; set; }

    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();

    public virtual ICollection<ResourceBooking> ResourceBookings { get; set; } = new List<ResourceBooking>();
}
