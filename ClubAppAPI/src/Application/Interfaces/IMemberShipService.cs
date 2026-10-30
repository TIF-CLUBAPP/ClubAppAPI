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
    Task CheckAndProcessExpirationsAsync();
}