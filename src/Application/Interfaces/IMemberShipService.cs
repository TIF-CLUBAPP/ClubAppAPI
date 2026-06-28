using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IMembershipService
{
    Task<IEnumerable<Membership>> GetAllMembershipsAsync();
    Task<Membership?> GetMembershipByUserIdAsync(int userId);
    Task<string> CreateMembershipAsync(CreateMembershipDto dto);
    Task<string> UpdateStatusAsync(int id, MembershipStatus newStatus);
}