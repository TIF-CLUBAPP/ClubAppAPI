using System;

namespace ClubApp.Domain.Entities;

public enum FriendshipStatus
{
    Pending,
    Accepted,
    Rejected
}

/// <summary>
/// Solicitud / relación de amistad entre dos socios del club.
/// La fila es direccional: <see cref="Requester"/> envía la solicitud y <see cref="Addressee"/> la recibe.
/// Estados: <see cref="FriendshipStatus.Pending"/> (pendiente), Accepted (amigos) y Rejected (rechazada).
/// </summary>
public class Friendship : BaseEntity
{
    public int RequesterId { get; set; }
    public virtual User Requester { get; set; } = null!;

    public int AddresseeId { get; set; }
    public virtual User Addressee { get; set; } = null!;

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

    /// <summary>Fecha de la última actualización (aceptación, rechazo o re-envío).</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
