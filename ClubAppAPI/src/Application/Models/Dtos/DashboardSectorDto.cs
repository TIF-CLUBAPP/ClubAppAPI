namespace ClubApp.Application.Dtos;

/// <summary>
/// Estado en tiempo real de un espacio físico (sector) para el widget
/// "Sectores del Club" del Dashboard.
/// </summary>
public class SectorStatusDto
{
    public int Id { get; set; }

    /// <summary>Nombre del espacio (ej. "Cancha de Tenis 1").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Deporte / categoría principal del espacio.</summary>
    public string SportCategory { get; set; } = string.Empty;

    /// <summary>Ubicación / sector del espacio.</summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>Estado en tiempo real: "available" | "occupied" | "maintenance".</summary>
    public string Status { get; set; } = "available";

    /// <summary>Personas / reservas que están usando el espacio en este momento.</summary>
    public int CurrentOccupancy { get; set; }

    /// <summary>Capacidad total del espacio (si se puede determinar). Null cuando no aplica.</summary>
    public int? Capacity { get; set; }

    /// <summary>Próxima reserva o actividad del día en formato "HH:mm" (hora local). Null si no hay.</summary>
    public string? NextTurn { get; set; }

    /// <summary>
    /// Indica si el espacio admite alquileres/reservas particulares de socios.
    /// Es true por defecto; false cuando el espacio está inactivo (mantenimiento)
    /// o pertenece a una categoría institucional del club (gimnasio, piscina, SUM, quincho).
    /// </summary>
    public bool IsReservable { get; set; }
}
