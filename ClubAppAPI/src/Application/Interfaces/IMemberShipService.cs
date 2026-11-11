using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IMembershipService
{
    Task<IEnumerable<Membership>> GetAllMembershipsAsync();
    Task<Membership?> GetMembershipByIdAsync(int id);
    Task<Membership?> GetMembershipByUserIdAsync(int userId);
    Task<Membership> CreateMembershipAsync(CreateMembershipDto dto);

    /// <summary>
    /// Suscripción digital de un usuario autenticado: lo marca como Socio activo,
    /// crea su membresía con la categoría y el canon mensual elegidos.
    /// </summary>
    Task<Membership> SubscribeAsync(int userId, SubscribeMembershipDto dto);

    Task<string> UpdateStatusAsync(int id, MembershipStatus newStatus);

    /// <summary>
    /// Cancela la membresía del usuario autenticado: lo marca como "no Socio"
    /// (IsMember = false), cambia sus membresías activas a CANCELLED y anula las
    /// cuotas pendientes/en mora. Devuelve el estado actualizado del usuario para
    /// que el frontend lo refleje sin recargar.
    /// </summary>
    Task<MembershipCancellationResult?> CancelSubscriptionAsync(int userId);

    /// <summary>
    /// Reactiva una membresía que fue cancelada con beneficios vigentes
    /// (CANCELED_PENDING_END): la devuelve a ACTIVE sin generar cuota nueva ni cobro
    /// extra, porque el período actual ya fue abonado. Devuelve el resultado para que
    /// el frontend lo refleje sin recargar.
    /// </summary>
    Task<MembershipReactivationResult?> ReactivateSubscriptionAsync(int userId);

    /// <summary>
    /// Devuelve la membresía vigente más reciente del usuario (o null si no tiene),
    /// junto con su condición de Socio activo. Usado por GET /api/memberships/me.
    /// </summary>
    Task<MyMembershipDto?> GetMyMembershipAsync(int userId);

    Task CheckAndProcessExpirationsAsync();
}

/// <summary>
/// Resultado de la cancelación: estado final de la membresía y del usuario.
/// </summary>
public class MembershipCancellationResult
{
    /// <summary>true si la operación se completó y persistió correctamente.</summary>
    public bool Success { get; set; }

    /// <summary>Mensaje descriptivo (éxito o motivo del rechazo).</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Nuevo rol del usuario (string, ej. "MEMBER").</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>true => Socio activo; false => ya no es socio.</summary>
    public bool IsSocio { get; set; }

    /// <summary>Estado final de la membresía cancelada (ej. "CANCELLED"), si existe.</summary>
    public string? MembershipStatus { get; set; }
}

/// <summary>
/// Resultado de la reactivación de una membresía cancelada con beneficios vigentes.
/// </summary>
public class MembershipReactivationResult
{
    /// <summary>true si la operación se completó y persistió correctamente.</summary>
    public bool Success { get; set; }

    /// <summary>Mensaje descriptivo (éxito o motivo del rechazo).</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Nuevo rol del usuario (string, ej. "MEMBER").</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>true => Socio activo.</summary>
    public bool IsSocio { get; set; }

    /// <summary>Estado final de la membresía reactivada (ej. "ACTIVE").</summary>
    public string? MembershipStatus { get; set; }

    /// <summary>Fecha de vencimiento del período vigente (para el frontend).</summary>
    public DateTime? EndDate { get; set; }
}