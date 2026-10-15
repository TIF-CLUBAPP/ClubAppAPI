using System.Text.Json.Serialization;

namespace ClubApp.Domain.Entities;

public enum NotificationCategory
{
    FriendRequest,
    Booking,
    Payment,
    System
}

public class Notification : BaseEntity
{
    /// <summary>Destinatario (null = aviso global visible para todos).</summary>
    public int? UserId { get; set; }
    public virtual User? User { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public NotificationCategory Category { get; set; } = NotificationCategory.System;

    public bool IsRead { get; set; } = false;

    /// <summary>Referencia opcional al recurso origen (id de solicitud de amistad, reserva, etc.).</summary>
    public string? ReferenceId { get; set; }

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}