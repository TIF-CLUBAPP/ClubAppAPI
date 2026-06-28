using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class MembershipService : IMembershipService
{
    private readonly ApplicationContext _context;

    public MembershipService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Membership>> GetAllMembershipsAsync()
    {
        return await _context.Memberships.ToListAsync();
    }

    public async Task<Membership?> GetMembershipByUserIdAsync(int userId)
    {
        return await _context.Memberships
            .Where(m => m.User_id == userId) 
            .OrderByDescending(m => m.EndTime)
            .FirstOrDefaultAsync();
    }

    public async Task<string> CreateMembershipAsync(CreateMembershipDto dto)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
        if (!userExists) return "USER_NOT_FOUND";

        DateTime startTime = DateTime.UtcNow;

        var latestMembership = await _context.Memberships
            .Where(m => m.User_id == dto.UserId && m.Status != MembershipStatus.EXPIRED)
            .OrderByDescending(m => m.EndTime)
            .FirstOrDefaultAsync();

        if (latestMembership != null && latestMembership.EndTime > DateTime.UtcNow)
        {
            startTime = latestMembership.EndTime;
        }

        DateTime endTime = startTime.AddMonths(1);

        var membership = new Membership
        {
            User_id = dto.UserId, 
            StartTime = startTime,
            EndTime = endTime,
            MonthlyPrice = dto.MonthlyPrice,
            Status = MembershipStatus.ACTIVE
        };

        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<string> UpdateStatusAsync(int id, MembershipStatus newStatus)
    {
        var membership = await _context.Memberships.FindAsync(id);
        if (membership == null) return "NOT_FOUND";

        membership.Status = newStatus;
        await _context.SaveChangesAsync();
        return "OK";
    }
}