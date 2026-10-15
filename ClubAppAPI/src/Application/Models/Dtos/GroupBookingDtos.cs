using System;
using System.Collections.Generic;

namespace ClubApp.Application.Dtos;

/// <summary>Entrada para iniciar una reserva grupal (POST /api/bookings/group/init).</summary>
public class InitGroupBookingRequest
{
    public string ResourceName { get; set; } = string.Empty;

    /// <summary>Espacio reservado (opcional, si se usa el catálogo de espacios).</summary>
    public int? SpaceId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    /// <summary>Precio base del turno (la comisión ATRIO se calcula en el servidor).</summary>
    public decimal Amount { get; set; }

    /// <summary>Número total de participantes (incluye al organizador). Mínimo 2.</summary>
    public int TotalParticipants { get; set; }

    /// <summary>Vigencia del link de pago en minutos (por defecto 60).</summary>
    public int ExpiresInMinutes { get; set; } = 60;

    /// <summary>Amigos/socios invitados (opcional). El organizador se agrega automáticamente.</summary>
    public List<GroupParticipantRequest>? Participants { get; set; }
}

public class GroupParticipantRequest
{
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
}

/// <summary>Entrada para registrar el pago de un participante (POST /api/bookings/group/{token}/pay).</summary>
public class GroupPayRequest
{
    /// <summary>ID del participante a marcar como pagado (solo organizador; simulación/gestión).</summary>
    public int? ParticipantId { get; set; }

    /// <summary>Método de pago (MERCADOPAGO, TRANSFERENCIA, etc.).</summary>
    public string Method { get; set; } = "MERCADOPAGO";

    public string? TransferReference { get; set; }
}

public class GroupParticipantDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsOrganizer { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTime? PaidAt { get; set; }
}

/// <summary>Estado de la reserva grupal expuesto al frontend (público por token).</summary>
public class GroupBookingDto
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public int? SpaceId { get; set; }
    public string? SpaceName { get; set; }
    public int OrganizerUserId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PerPersonAmount { get; set; }
    public decimal MarketplaceFee { get; set; }
    public int TotalParticipants { get; set; }
    public int PaidCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string TransferAlias { get; set; } = string.Empty;
    public List<GroupParticipantDto> Participants { get; set; } = new();
}
