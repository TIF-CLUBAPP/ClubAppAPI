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
            .Where(m => m.UserId == userId)
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
            .Where(m => m.UserId == dto.UserId && m.Status != MembershipStatus.EXPIRED)
            .OrderByDescending(m => m.EndDate) // Cambiado a EndDate
            .FirstOrDefaultAsync();

        if (latestMembership != null && latestMembership.EndDate > DateTime.UtcNow) // Cambiado a EndDate
        {
            startTime = latestMembership.EndDate; // Cambiado a EndDate
        }

        DateTime endTime = startTime.AddMonths(1);

        var membership = new Membership
        {
            UserId = dto.UserId,
            StartDate = startTime, // Cambiado a StartDate
            EndDate = endTime,     // Cambiado a EndDate
            MonthlyPrice = dto.MonthlyPrice,
            Status = MembershipStatus.ACTIVE
        };

        await _context.Memberships.AddAsync(membership);
        
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(new CreateNotificationDto {
            UserId = dto.UserId,
            Title = "Membresía Registrada",
            Message = $"Tu membresía fue procesada con éxito. Fecha de vencimiento: {endTime:dd/MM/yyyy}."
        });

        return membership;
    }

    public async Task<Membership> SubscribeAsync(int userId, SubscribeMembershipDto dto)
    {
        if (dto == null || dto.MonthlyPrice <= 0)
        {
            throw new AppValidationException("Debe seleccionar una categoría de membresía válida.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        // El usuario pasa a ser Socio activo del club. Esto habilita la generación
        // de su cuota social (Payment) en GET /api/payments/mine.
        user.IsMember = true;

        var now = DateTime.UtcNow;

        // Si ya posee una membresía activa, la nueva se encadena a partir de su vencimiento.
        var latestMembership = await _context.Memberships
            .Where(m => m.UserId == userId && m.Status != MembershipStatus.EXPIRED)
            .OrderByDescending(m => m.EndDate)
            .FirstOrDefaultAsync();

        var startTime = latestMembership != null && latestMembership.EndDate > now
            ? latestMembership.EndDate
            : now;

        var endTime = startTime.AddMonths(1);

        var membership = new Membership
        {
            UserId = userId,
            StartDate = startTime,
            EndDate = endTime,
            MonthlyPrice = dto.MonthlyPrice,
            Status = MembershipStatus.ACTIVE
        };

        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();

        var typeLabel = string.IsNullOrWhiteSpace(dto.MembershipType) ? "Socio" : dto.MembershipType;

        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = userId,
            Title = "Membresía Registrada",
            Message = $"Tu membresía {typeLabel} fue procesada con éxito. Fecha de vencimiento: {endTime:dd/MM/yyyy}."
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
            UserId = m.UserId,
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
            UserId = m.UserId,
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