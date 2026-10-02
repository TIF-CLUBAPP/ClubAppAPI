using System;
using System.Text.Json.Serialization;

namespace ClubApp.Application.Dtos;

/// <summary>Espacio físico del club expuesto al frontend.</summary>
public class SpaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SportCategory { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    [JsonPropertyName("allowReservations")]
    public bool AllowReservationsDuringClasses { get; set; }

    [JsonPropertyName("requiresApproval")]
    public bool RequiresApproval { get; set; }

    [JsonPropertyName("permitir_superposicion")]
    public bool PermitirSuperposicion { get; set; }

    [JsonPropertyName("pricePerHour")]
    public decimal PricePerHour { get; set; }

    [JsonPropertyName("slotDurationMinutes")]
    public int SlotDurationMinutes { get; set; }

    [JsonPropertyName("is24Hours")]
    public bool Is24Hours { get; set; }

    [JsonPropertyName("openTime")]
    public string? OpenTime { get; set; }

    [JsonPropertyName("closeTime")]
    public string? CloseTime { get; set; }
}

/// <summary>Entrada para crear/actualizar un espacio (POST/PUT /api/spaces).</summary>
public class SaveSpaceRequest
{
    public string Name { get; set; } = string.Empty;
    public string SportCategory { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("allowReservations")]
    public bool AllowReservationsDuringClasses { get; set; } = false;

    [JsonPropertyName("requiresApproval")]
    public bool RequiresApproval { get; set; } = false;

    [JsonPropertyName("permitir_superposicion")]
    public bool PermitirSuperposicion { get; set; }

    [JsonPropertyName("pricePerHour")]
    public decimal PricePerHour { get; set; }

    [JsonPropertyName("slotDurationMinutes")]
    public int SlotDurationMinutes { get; set; } = 60;

    [JsonPropertyName("is24Hours")]
    public bool Is24Hours { get; set; } = false;

    [JsonPropertyName("openTime")]
    public string? OpenTime { get; set; }

    [JsonPropertyName("closeTime")]
    public string? CloseTime { get; set; }
}

/// <summary>Turno bloqueado de una cancha por una clase/actividad del club.</summary>
public class BlockedSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ActivityName { get; set; } = string.Empty;
    public int ActivityScheduleId { get; set; }
}
