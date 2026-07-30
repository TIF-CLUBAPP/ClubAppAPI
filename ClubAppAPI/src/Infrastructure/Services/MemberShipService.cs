using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
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

    // 1. Método nuevo para consultar por ID propio de la membresía (necesario para CreatedAtAction)
    public async Task<Membership?> GetMembershipByIdAsync(int id)
    {
        return await _context.Memberships.FindAsync(id);
    }

    public async Task<Membership?> GetMembershipByUserIdAsync(int userId)
    {
        return await _context.Memberships
            .Where(m => m.User_id == userId)
            .OrderByDescending(m => m.EndDate) // Cambiado a EndDate
            .FirstOrDefaultAsync();
    }

    // 2. Devuelve la entidad Membership recién creada con su ID generado por la BD
    public async Task<Membership> CreateMembershipAsync(CreateMembershipDto dto)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
        if (!userExists)
        {
            throw new NotFoundException("User", dto.UserId);
        }

        DateTime startTime = DateTime.UtcNow;

        var latestMembership = await _context.Memberships
            .Where(m => m.User_id == dto.UserId && m.Status != MembershipStatus.EXPIRED)
            .OrderByDescending(m => m.EndDate) // Cambiado a EndDate
            .FirstOrDefaultAsync();

        if (latestMembership != null && latestMembership.EndDate > DateTime.UtcNow) // Cambiado a EndDate
        {
            startTime = latestMembership.EndDate; // Cambiado a EndDate
        }

        DateTime endTime = startTime.AddMonths(1);

        var membership = new Membership
        {
            User_id = dto.UserId,
            StartDate = startTime, // Cambiado a StartDate
            EndDate = endTime,     // Cambiado a EndDate
            MonthlyPrice = dto.MonthlyPrice,
            Status = MembershipStatus.ACTIVE
        };

        await _context.Memberships.AddAsync(membership);
        
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(new CreateNotificationDto {
            User_id = dto.UserId,
            Title = "Membresía Registrada",
            Message = $"Tu membresía fue procesada con éxito. Fecha de vencimiento: {endTime:dd/MM/yyyy}."
        });

        return membership;
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
            .Where(m => m.Status == MembershipStatus.ACTIVE && m.EndDate <= warningThreshold && m.EndDate > now) // Cambiado a EndDate
            .ToListAsync();

        foreach (var m in expiringMemberships)
        {
            m.Status = MembershipStatus.EXPIRING;
            
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto {
                User_id = m.User_id,
                Title = "Tu membresía está por vencer",
                Message = $"Tu acceso al club vencerá en menos de 3 días ({m.EndDate:dd/MM/yyyy}). ¡Renová pronto para evitar cortes en el servicio!" // Cambiado a EndDate
            });
        }

        var expiredMemberships = await _context.Memberships
            .Where(m => (m.Status == MembershipStatus.ACTIVE || m.Status == MembershipStatus.EXPIRING) && m.EndDate <= now) // Cambiado a EndDate
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