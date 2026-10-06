using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities;

public enum GroupBookingStatus
{
    Collecting,
    Completed,
    Cancelled,
    Expired
}

/// <summary>
/// Reserva grupal / pago dividido. Agrupa la reserva de un espacio cuyo importe se
/// divide entre el organizador y sus amigos. Se expone públicamente mediante un token único.
/// </summary>
public class GroupBooking : BaseEntity
{
    /// <summary>Token público (formato GRP-XXXX-XXXX) para compartir el link de pago.</summary>
    [Required]
    public string Token { get; set; } = string.Empty;

    public int OrganizerUserId { get; set; }
    public virtual User Organizer { get; set; } = null!;

    /// <summary>Reserva real que mantiene bloqueado el turno. Null hasta que se crea.</summary>
    public int? ResourceBookingId { get; set; }
    public virtual ResourceBooking? ResourceBooking { get; set; }

    [Required]
    public string ResourceName { get; set; } = string.Empty;

    public int? SpaceId { get; set; }
    public virtual Space? Space { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    /// <summary>Precio base del turno (neto, sin comisión).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>Cuota neta por persona (TotalAmount / TotalParticipants).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PerPersonAmount { get; set; }

    /// <summary>Comisión ATRIO aplicada sobre la cuota del organizador.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal MarketplaceFee { get; set; }

    /// <summary>Número total de participantes (incluye al organizador).</summary>
    public int TotalParticipants { get; set; }

    public GroupBookingStatus Status { get; set; } = GroupBookingStatus.Collecting;

    public DateTime ExpiresAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual ICollection<GroupParticipant> Participants { get; set; } = new List<GroupParticipant>();
}
