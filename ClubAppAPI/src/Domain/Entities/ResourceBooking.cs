using System;
using System.ComponentModel.DataAnnotations;

namespace ClubApp.Domain.Entities;

public enum BookingStatus
{
    PendingPayment,
    PendingApproval,
    Confirmed,
    Cancelled
}

public class ResourceBooking : BaseEntity
{
    [Required]
    public string ResourceName { get; set; } = string.Empty;

    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;

    /// <summary>Espacio reservado (clave foránea a Space). Null = reserva legacy por nombre.</summary>
    public int? SpaceId { get; set; }
    public virtual Space? Space { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    /// <summary>Pago vinculado a la reserva (se crea al reservar y se confirma al pagar).</summary>
    public int? PaymentId { get; set; }
    public virtual Payment? Payment { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;
}