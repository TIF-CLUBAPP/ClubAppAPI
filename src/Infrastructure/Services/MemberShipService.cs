using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ClubApp.Infrastructure.Services;

public class MembershipService : IMembershipService
{
    private readonly ApplicationContext _context;
    private readonly INotificationService _notificationService;

    public MembershipService(ApplicationContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
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
        
        await _notificationService.CreateNotificationAsync(new CreateNotificationDto {
            User_id = dto.UserId,
            Title = "Membresía Registrada",
            Message = $"Tu membresía fue procesada con éxito. Fecha de vencimiento: {endTime:dd/MM/yyyy}."
        });

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

    public async Task CheckAndProcessExpirationsAsync()
    {
        var now = DateTime.UtcNow;
        var warningThreshold = now.AddDays(3); 

        var expiringMemberships = await _context.Memberships
            .Where(m => m.Status == MembershipStatus.ACTIVE && m.EndTime <= warningThreshold && m.EndTime > now)
            .ToListAsync();

        foreach (var m in expiringMemberships)
        {
            m.Status = MembershipStatus.EXPIRING;
            
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto {
                User_id = m.User_id,
                Title = "Tu membresía está por vencer",
                Message = $"Tu acceso al club vencerá en menos de 3 días ({m.EndTime:dd/MM/yyyy}). ¡Renová pronto para evitar cortes en el servicio!"
            });
        }


        var expiredMemberships = await _context.Memberships
            .Where(m => (m.Status == MembershipStatus.ACTIVE || m.Status == MembershipStatus.EXPIRING) && m.EndTime <= now)
            .ToListAsync();

        foreach (var m in expiredMemberships)
        {
            m.Status = MembershipStatus.EXPIRED;

            await _context.Notifications.AddAsync(new Notification {
                User_id = m.User_id,
                Title = "Membresía Vencida",
                Message = "Tu membresía ha caducado. Por favor, realizá el pago de la nueva cuota para reactivar tu acceso a las instalaciones.",
                SentAt = DateTime.UtcNow,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
    }
}