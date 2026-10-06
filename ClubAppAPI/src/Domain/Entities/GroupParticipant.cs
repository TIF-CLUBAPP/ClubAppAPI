using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities;

public enum GroupParticipantStatus
{
    Pending,
    Paid
}

/// <summary>
/// Participante de una reserva grupal. Puede ser el organizador (que abona su cuota al
/// iniciar) o un amigo/socio invitado. Los invitados sin cuenta registrada se guardan
/// con UserId null (invitado).
/// </summary>
public class GroupParticipant : BaseEntity
{
    public int GroupBookingId { get; set; }
    public virtual GroupBooking GroupBooking { get; set; } = null!;

    public int? UserId { get; set; }
    public virtual User? User { get; set; }

    [Required]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Email { get; set; }

    /// <summary>true solo para el organizador de la reserva.</summary>
    public bool IsOrganizer { get; set; }

    /// <summary>Monto que debe abonar este participante (el organizador incluye la comisión).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public GroupParticipantStatus Status { get; set; } = GroupParticipantStatus.Pending;

    public DateTime? PaidAt { get; set; }

    /// <summary>Pago vinculado (se crea al registrar el cobro de este participante).</summary>
    public int? PaymentId { get; set; }
    public virtual Payment? Payment { get; set; }
}
