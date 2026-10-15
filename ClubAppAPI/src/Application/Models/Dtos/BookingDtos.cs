using System;

namespace ClubApp.Application.Dtos;

/// <summary>Entrada para crear una reserva de espacio (POST /api/bookings).</summary>
public class CreateBookingRequest
{
    public string ResourceName { get; set; } = string.Empty;

    /// <summary>Espacio reservado (opcional, si se usa el catálogo de espacios).</summary>
    public int? SpaceId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    /// <summary>Precio base del turno (la comisión ATRIO se calcula en el servidor).</summary>
    public decimal Amount { get; set; }
}

/// <summary>Reserva de espacio expuesta al frontend.</summary>
public class BookingDto
{
    public int Id { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public int? SpaceId { get; set; }
    public string? SpaceName { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? PaymentId { get; set; }
    public decimal Amount { get; set; }
    public decimal MarketplaceFee { get; set; }
    public decimal TotalAmount { get; set; }
    public string TransferAlias { get; set; } = string.Empty;
    public string PayoutCollector { get; set; } = string.Empty;
}