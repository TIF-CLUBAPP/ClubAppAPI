using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Services;

public class MembershipService : IMembershipService
{
    private static List<MembershipDto> _memberships = new List<MembershipDto>();

    public async Task<IEnumerable<MembershipDto>> GetAllMembershipsAsync()
    {
        return await Task.FromResult(_memberships);
    }

    public async Task<MembershipDto?> GetByUserIdAsync(int userId)
    {
        var membership = _memberships.FirstOrDefault(m => m.User_id == userId);
        return await Task.FromResult(membership);
    }

    public async Task<bool> CreateMembershipAsync(MembershipDto dto)
    {
        dto.Id = _memberships.Any() ? _memberships.Max(m => m.Id) + 1 : 1;
        dto.StartTime = DateTime.Now;
        dto.EndTime = DateTime.Now.AddMonths(1); // Por defecto un mes
        _memberships.Add(dto);
        return await Task.FromResult(true);
    }

    public async Task<bool> UpdateStatusAsync(int id, string newStatus)
    {
        var membership = _memberships.FirstOrDefault(m => m.Id == id);
        if (membership == null) return false;
        
        membership.Status = newStatus.ToUpper();
        return await Task.FromResult(true);
    }
}