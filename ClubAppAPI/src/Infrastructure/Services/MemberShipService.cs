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

        // ===== Validación de estado previo: evita suscripciones duplicadas, pero
        // permite la REACTIVACIÓN desde estados cancelados/inactivos =====
        // Solo se rechaza si existe una membresía ACTIVA (en curso o por vencer): ese
        // usuario ya es Socio y no necesita re-suscribirse. Un usuario INACTIVE,
        // CANCELLED o CANCELED_PENDING_END (membersía cancelada o vencida) SÍ puede
        // volver a asociarse, generando una nueva membresía en PENDING_PAYMENT con su
        // cuota inicial.
        var hasActiveMembership = await _context.Memberships
            .AnyAsync(m => m.UserId == userId
                && (m.Status == MembershipStatus.ACTIVE
                    || m.Status == MembershipStatus.EXPIRING));

        if (hasActiveMembership)
        {
            throw new AppValidationException(
                "Ya poseés una membresía activa. Si tenés una cuota pendiente, abonala desde Mis Cuotas para mantener tu condición de Socio.");
        }

        var hasPendingCuota = await _context.Payments
            .AnyAsync(p => p.UserId == userId
                && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue)
                && p.Amount > 0m);

        if (hasPendingCuota)
        {
            throw new AppValidationException(
                "Ya tenés una cuota social pendiente de pago. Completá el abono desde Mis Cuotas antes de iniciar una nueva suscripción.");
        }

        // El usuario pasa a ser Socio activo del club (con la membresía pendiente de pago).
        // Esto habilita la generación de su cuota social (Payment) en GET /api/payments/mine.
        user.IsMember = true;

        var now = DateTime.UtcNow;
        var endTime = now.AddMonths(1);

        // La suscripción queda PENDING_PAYMENT (pendiente de pago) hasta que se acredite
        // la cuota inicial. El dominio modela "pendiente de pago" como
        // MembershipStatus.PENDING_PAYMENT + IsMember = true + una cuota en
        // PaymentStatus.Pending. Al acreditarse el pago, un proceso posterior promueve la
        // membresía a ACTIVE y habilita los beneficios de Socio.
        var membership = new Membership
        {
            UserId = userId,
            StartDate = now,
            EndDate = endTime,
            MonthlyPrice = dto.MonthlyPrice,
            Status = MembershipStatus.PENDING_PAYMENT
        };

        // Cuota inicial en estado PENDING con el canon elegido + costo de servicio (comisión
        // ATRIO) configurado a nivel global del Club. Debe persistir junto con la membresía
        // en una ÚNICA transacción: si falla el guardado, no se guarda nada ni se notifica.
        var period = $"{now:yyyy-MM}";

        var baseAmount = dto.MonthlyPrice > 0m ? dto.MonthlyPrice : 15000m;

        var clubConfig = await _context.ClubConfigs.FirstOrDefaultAsync();
        var feePercentage = clubConfig?.ApplicationFeePercentage ?? 3.5m;
        var maxFee = clubConfig?.MaxApplicationFeeAmount ?? 1500m;
        var marketplaceFee = Math.Min(
            Math.Round(baseAmount * (feePercentage / 100m), 2, MidpointRounding.AwayFromZero),
            maxFee);

        // ===== Transacción atómica: membresía + cuota + IsMember =====
        // Si SaveChangesAsync/CommitAsync falla, se hace rollback de todo y el
        // middleware devuelve 500 (nunca un 200 OK ficticio). La notificación
        // SOLO se emite después de confirmar la transacción.
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            await _context.Memberships.AddAsync(membership);

            _context.Payments.Add(new Payment
            {
                UserId = userId,
                Period = period,
                Amount = baseAmount,
                MarketplaceFee = marketplaceFee,
                LateFeeApplied = 0m,
                PaymentMethod = string.Empty,
                Status = PaymentStatus.Pending,
                PaymentDate = null,
                CreatedAt = now
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = userId,
            Title = "Cuota Social Generada",
            Message = "Se generó tu primera cuota social. Abonala desde la sección Mis Cuotas para activar tu condición de Socio Activo.",
            Category = NotificationCategory.Payment
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

    public async Task<MembershipCancellationResult?> CancelSubscriptionAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new MembershipCancellationResult { Success = false, Message = "Usuario no encontrado." };
        }

        // ===== Validación de estado previo: solo se cancela si existe una membresía vigente =====
        var cancelableStatuses = new[] { MembershipStatus.ACTIVE, MembershipStatus.EXPIRING, MembershipStatus.INACTIVE, MembershipStatus.SUSPENDED };

        var memberships = await _context.Memberships
            .Where(m => m.UserId == userId && cancelableStatuses.Contains(m.Status))
            .OrderByDescending(m => m.EndDate)
            .ToListAsync();

        var hasPendingCuota = await _context.Payments
            .AnyAsync(p => p.UserId == userId
                && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue));

        // No hay membresía vigente que cancelar ni condición de socio: rechazo idempotente.
        if (memberships.Count == 0 && !user.IsMember && !hasPendingCuota)
        {
            return new MembershipCancellationResult
            {
                Success = false,
                Message = "No tenés una membresía activa para cancelar."
            };
        }

        // 1) El usuario NO deja de ser Socio inmediatamente (isSocio = true).
        // 2) Cambio de estado de membresía: todas las membresías vigentes pasan a CANCELED_PENDING_END.
        foreach (var m in memberships)
        {
            m.Status = MembershipStatus.CANCELED_PENDING_END;
        }

        // 3) Se anulan (NO se borran) las cuotas pendientes/en mora para preservar la
        // trazabilidad contable: pasan a Cancelled en lugar de eliminarse físicamente.
        var pendingPayments = await _context.Payments
            .Where(p => p.UserId == userId && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue))
            .ToListAsync();

        foreach (var p in pendingPayments)
        {
            p.Status = PaymentStatus.Cancelled;
        }

        await _context.SaveChangesAsync();

        // ===== Validación defensiva: nunca asumir que existe al menos una membresía =====
        // `memberships` puede quedar vacía (ej. user.IsMember == true o hasPendingCuota == true
        // sin una fila cancelable en Memberships), lo que hacía fallar a `.First()` con
        // "Sequence contains no elements". Se usa FirstOrDefault + fallback seguro.
        var target = memberships.FirstOrDefault();

        var benefitEndDate = target?.EndDate ?? DateTime.UtcNow;
        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = userId,
            Title = "Membresía Cancelada",
            Message = $"Tu membresía al club ha sido cancelada, pero mantendrás beneficios hasta {benefitEndDate:dd/MM/yyyy}. No se generarán nuevas cuotas."
        });

        var cancelledStatus = target?.Status.ToString() ?? MembershipStatus.CANCELED_PENDING_END.ToString();

        return new MembershipCancellationResult
        {
            Success = true,
            Message = "Membresía cancelada con éxito. Mantendrás beneficios hasta el vencimiento.",
            Role = user.Role.ToString(),
            IsSocio = true, // Sigue siendo socio hasta el fin del periodo
            MembershipStatus = cancelledStatus
        };
    }

    public async Task<MembershipReactivationResult?> ReactivateSubscriptionAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new MembershipReactivationResult { Success = false, Message = "Usuario no encontrado." };
        }

        // Sólo se reactiva una membresía que fue cancelada conservando beneficios
        // vigentes (CANCELED_PENDING_END). Cualquier otro estado no se reactiva por esta vía.
        var membership = await _context.Memberships
            .Where(m => m.UserId == userId && m.Status == MembershipStatus.CANCELED_PENDING_END)
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();

        if (membership == null)
        {
            return new MembershipReactivationResult
            {
                Success = false,
                Message = "No tenés una baja programada para reactivar. Si tu membresía venció, asociate nuevamente desde el botón de suscripción."
            };
        }

        // Si el período ya venció, la reactivación directa no procede: el usuario debe
        // re-suscribirse (CASO B), lo que generará una nueva cuota pendiente.
        if (membership.EndDate <= DateTime.UtcNow)
        {
            return new MembershipReactivationResult
            {
                Success = false,
                Message = "Tu período pagado ya venció. Asociate nuevamente para generar tu nueva cuota."
            };
        }

        // Reactivación directa: NO se genera cuota nueva ni cobro extra, porque el
        // período actual ya fue abonado.
        membership.Status = MembershipStatus.ACTIVE;
        user.IsMember = true;

        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = userId,
            Title = "Membresía Reactivada",
            Message = $"Tu membresía fue reactivada con éxito y seguís siendo Socio Activo hasta {membership.EndDate:dd/MM/yyyy}."
        });

        return new MembershipReactivationResult
        {
            Success = true,
            Message = "Membresía reactivada con éxito.",
            Role = user.Role.ToString(),
            IsSocio = true,
            MembershipStatus = membership.Status.ToString(),
            EndDate = membership.EndDate
        };
    }

    public async Task<MyMembershipDto?> GetMyMembershipAsync(int userId)
    {
        // Se toma la membresía más reciente (mayor Id): ante una reactivación desde
        // CANCELED_PENDING_END/CANCELLED/INACTIVE siempre gana la nueva membresía
        // PENDING_PAYMENT por encima de la cancelada, que aún conserva beneficios hasta
        // el fin del período pagado. Ordenar solo por EndDate podía devolver la membresía
        // cancelada (con EndDate futura) y romper el estado del Dashboard.
        var membership = await _context.Memberships
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();

        if (membership == null) return null;

        // Es Socio activo si está ACTIVE (cuota al día) o si está en período de gracia
        // tras cancelar (CANCELED_PENDING_END con EndDate futura). PENDING_PAYMENT,
        // INACTIVE, CANCELLED y EXPIRED NO habilitan la condición de Socio activo.
        var isActive = membership.Status == MembershipStatus.ACTIVE ||
                       (membership.Status == MembershipStatus.CANCELED_PENDING_END && membership.EndDate > DateTime.UtcNow);

        return new MyMembershipDto
        {
            MembershipId = membership.Id,
            Status = membership.Status.ToString(),
            MembershipType = "SOCIO_ACTIVO",
            MonthlyPrice = membership.MonthlyPrice,
            IsSocio = isActive,
            NextDueDate = membership.EndDate
        };
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