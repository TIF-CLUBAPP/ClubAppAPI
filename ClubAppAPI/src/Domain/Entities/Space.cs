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

    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();

    public virtual ICollection<ResourceBooking> ResourceBookings { get; set; } = new List<ResourceBooking>();
}
