using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IMembershipService
{
    Task<IEnumerable<MembershipDto>> GetAllMembershipsAsync();
    Task<MembershipDto?> GetByUserIdAsync(int userId);
    Task<bool> CreateMembershipAsync(MembershipDto dto);
    Task<bool> UpdateStatusAsync(int id, string newStatus);
}