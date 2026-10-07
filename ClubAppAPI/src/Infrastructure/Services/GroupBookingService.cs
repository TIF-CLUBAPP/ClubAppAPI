using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Constants;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;
using System.Security.Cryptography;

namespace ClubApp.Infrastructure.Services;

public class GroupBookingService : IGroupBookingService
{
    private readonly ApplicationContext _context;
    private readonly IPaymentService _paymentService;
    private readonly INotificationService _notificationService;

    public GroupBookingService(ApplicationContext context, IPaymentService paymentService, INotificationService notificationService)
    {
        _context = context;
        _paymentService = paymentService;
        _notificationService = notificationService;
    }

    public async Task<GroupBookingDto> InitAsync(int organizerUserId, InitGroupBookingRequest dto)
    {
        if (dto.StartTime >= dto.EndTime)
            throw new AppValidationException("El horario de fin debe ser posterior al de inicio.");

        if (dto.Amount < 0)
            throw new AppValidationException("El monto no puede ser negativo.");

        if (dto.TotalParticipants < 2)
            throw new AppValidationException("La reserva grupal requiere al menos 2 participantes (organizador + 1 amigo).");

        var organizer = await _context.Users.FindAsync(organizerUserId);
        if (organizer == null) throw new NotFoundException("User", organizerUserId);

        // Resolver el espacio (si viene del catálogo) y validar conflicto con clases.
        Space? space = null;
        if (dto.SpaceId.HasValue)
        {
            space = await _context.Spaces.FindAsync(dto.SpaceId.Value);
            if (space == null) throw new NotFoundException("Space", dto.SpaceId.Value);
            await EnsureNoClassConflictAsync(space, dto.StartTime, dto.EndTime);
        }

        var resourceName = string.IsNullOrWhiteSpace(dto.ResourceName)
            ? (space?.Name ?? string.Empty)
            : dto.ResourceName.Trim();

        if (string.IsNullOrWhiteSpace(resourceName))
            throw new AppValidationException("Debés indicar el espacio a reservar.");

        var overlap = await _context.ResourceBookings.AnyAsync(b =>
            b.Status != BookingStatus.Cancelled &&
            b.StartTime < dto.EndTime &&
            dto.StartTime < b.EndTime &&
            (dto.SpaceId.HasValue
                ? b.SpaceId == dto.SpaceId.Value
                : b.ResourceName == resourceName));

        if (overlap)
            throw new AppValidationException("El turno seleccionado ya no está disponible.");

        // Regla de comisión ATRIO aplicada sobre la cuota del organizador: min(cuota * %, tope).
        var config = await _paymentService.GetPayoutConfigAsync();
        var percentage = config.ApplicationFeePercentage > 0
            ? config.ApplicationFeePercentage
            : ClubConfigDefaults.DefaultApplicationFeePercentage;
        var cap = config.MaxApplicationFeeAmount > 0
            ? config.MaxApplicationFeeAmount
            : ClubConfigDefaults.DefaultMaxApplicationFeeAmount;

        var perPerson = Math.Round(dto.Amount / dto.TotalParticipants, 2, MidpointRounding.AwayFromZero);
        var rawFee = perPerson * (percentage / 100m);
        var fee = Math.Round(Math.Min(rawFee, cap), 2, MidpointRounding.AwayFromZero);
        if (fee < 0) fee = 0;

        var token = GenerateToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(Math.Max(1, dto.ExpiresInMinutes));

        // Reserva real temporal para bloquear el turno (se confirma cuando todos pagan).
        var booking = new ResourceBooking
        {
            ResourceName = resourceName,
            SpaceId = dto.SpaceId,
            UserId = organizerUserId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = space?.RequiresApproval == true
                ? BookingStatus.PendingApproval
                : BookingStatus.PendingPayment,
            CreatedAt = DateTime.UtcNow
        };
        _context.ResourceBookings.Add(booking);
        await _context.SaveChangesAsync();

        var group = new GroupBooking
        {
            Token = token,
            OrganizerUserId = organizerUserId,
            ResourceBookingId = booking.Id,
            ResourceName = resourceName,
            SpaceId = dto.SpaceId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            TotalAmount = dto.Amount,
            PerPersonAmount = perPerson,
            MarketplaceFee = fee,
            TotalParticipants = dto.TotalParticipants,
            Status = GroupBookingStatus.Collecting,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
        _context.GroupBookings.Add(group);
        await _context.SaveChangesAsync();

        // Cuota del organizador: se registra como pagada al iniciar la reserva grupal.
        var organizerPayment = new Payment
        {
            UserId = organizerUserId,
            Period = $"GRP{group.Id}",
            Amount = perPerson + fee,
            LateFeeApplied = 0m,
            MarketplaceFee = fee,
            Status = PaymentStatus.Paid,
            PaymentMethod = "RESERVA_GRUPAL",
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(organizerPayment);
        await _context.SaveChangesAsync();

        var organizerParticipant = new GroupParticipant
        {
            GroupBookingId = group.Id,
            UserId = organizerUserId,
            DisplayName = organizer.FullName,
            Email = organizer.Email,
            IsOrganizer = true,
            Amount = perPerson + fee,
            Status = GroupParticipantStatus.Paid,
            PaidAt = DateTime.UtcNow,
            PaymentId = organizerPayment.Id,
            CreatedAt = DateTime.UtcNow
        };
        group.Participants.Add(organizerParticipant);

        // Amigos/socios invitados (pendientes de pago).
        if (dto.Participants != null)
        {
            foreach (var p in dto.Participants.Take(Math.Max(0, dto.TotalParticipants - 1)))
            {
                if (string.IsNullOrWhiteSpace(p.Name)) continue;

                group.Participants.Add(new GroupParticipant
                {
                    GroupBookingId = group.Id,
                    UserId = p.UserId,
                    DisplayName = p.Name.Trim(),
                    Email = string.IsNullOrWhiteSpace(p.Email) ? null : p.Email.Trim(),
                    IsOrganizer = false,
                    Amount = perPerson,
                    Status = GroupParticipantStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        // Notificar a los socios invitados a participar de la reserva grupal.
        if (dto.Participants != null)
        {
            foreach (var invitedUserId in dto.Participants
                         .Where(p => p.UserId.HasValue && !string.IsNullOrWhiteSpace(p.Name))
                         .Select(p => p.UserId!.Value)
                         .Distinct())
            {
                await TryNotifyAsync(invitedUserId,
                    "Invitación a reserva grupal",
                    $"{organizer.FullName} te invitó a una reserva de {resourceName}.",
                    NotificationCategory.Booking,
                    group.Id.ToString());
            }
        }

        var alias = ResolveAlias(config.BankAlias);
        return BuildDto(group, alias);
    }

    public async Task<GroupBookingDto> GetByTokenAsync(string token)
    {
        var group = await LoadGroupAsync(token);
        if (group == null) throw new NotFoundException("GroupBooking", token);

        await MarkExpiredIfNeededAsync(group);

        var alias = await ResolveAliasAsync();
        return BuildDto(group, alias);
    }

    public async Task<GroupBookingDto> PayAsync(string token, int userId, GroupPayRequest dto)
    {
        var group = await LoadGroupAsync(token);
        if (group == null) throw new NotFoundException("GroupBooking", token);

        if (group.Status == GroupBookingStatus.Cancelled)
            throw new AppValidationException("La reserva grupal fue cancelada.");

        var alreadyPaidCount = group.Participants.Count(p => p.Status == GroupParticipantStatus.Paid);
        if (group.Status == GroupBookingStatus.Completed || alreadyPaidCount >= group.TotalParticipants)
            throw new AppValidationException("La reserva ya se encuentra completada y pagada en su totalidad.");

        await MarkExpiredIfNeededAsync(group);
        if (group.Status == GroupBookingStatus.Expired)
            throw new AppValidationException("El link de pago expiró.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new NotFoundException("User", userId);

        GroupParticipant? participant;

        if (dto.ParticipantId.HasValue)
        {
            // Marcado manual: solo el organizador puede registrar el pago de otro participante.
            if (group.OrganizerUserId != userId)
                throw new NotAllowedException("Solo el organizador puede registrar el pago de otro participante.");

            participant = group.Participants.FirstOrDefault(p => p.Id == dto.ParticipantId.Value)
                ?? throw new NotFoundException("GroupParticipant", dto.ParticipantId.Value);
        }
        else
        {
            participant = group.Participants.FirstOrDefault(p => p.UserId == userId && !p.IsOrganizer);

            if (participant == null)
            {
                participant = new GroupParticipant
                {
                    GroupBookingId = group.Id,
                    UserId = userId,
                    DisplayName = user.FullName,
                    Email = user.Email,
                    IsOrganizer = false,
                    Amount = group.PerPersonAmount,
                    Status = GroupParticipantStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };
                group.Participants.Add(participant);
            }
        }

        if (participant.Status == GroupParticipantStatus.Paid)
            throw new AppValidationException("Este participante ya abonó su cuota.");

        var payment = new Payment
        {
            UserId = userId,
            Period = $"GRP{group.Id}-{participant.Id}",
            Amount = participant.Amount,
            LateFeeApplied = 0m,
            MarketplaceFee = 0m,
            Status = PaymentStatus.Paid,
            PaymentMethod = string.IsNullOrWhiteSpace(dto.Method)
                ? "RESERVA_GRUPAL"
                : dto.Method.ToUpperInvariant(),
            TransferReference = string.IsNullOrWhiteSpace(dto.TransferReference)
                ? null
                : dto.TransferReference.Trim(),
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        participant.PaymentId = payment.Id;
        participant.Status = GroupParticipantStatus.Paid;
        participant.PaidAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Completar la reserva cuando ya no quedan cuotas pendientes.
        var paidCount = group.Participants.Count(p => p.Status == GroupParticipantStatus.Paid);
        if (paidCount >= group.TotalParticipants && group.Status == GroupBookingStatus.Collecting)
        {
            group.Status = GroupBookingStatus.Completed;
            group.CompletedAt = DateTime.UtcNow;

            if (group.ResourceBookingId.HasValue)
            {
                var booking = await _context.ResourceBookings.FindAsync(group.ResourceBookingId.Value);
                if (booking != null && booking.Status == BookingStatus.PendingPayment)
                    booking.Status = BookingStatus.Confirmed;
            }

            await _context.SaveChangesAsync();
        }

        var alias = await ResolveAliasAsync();
        return BuildDto(group, alias);
    }
    private async Task<GroupBooking?> LoadGroupAsync(string token)
    {
        return await _context.GroupBookings
            .Include(g => g.Organizer)
            .Include(g => g.Participants)
            .Include(g => g.Space)
            .FirstOrDefaultAsync(g => g.Token == token);
    }

    private async Task MarkExpiredIfNeededAsync(GroupBooking group)
    {
        if (group.Status == GroupBookingStatus.Collecting && group.ExpiresAt < DateTime.UtcNow)
        {
            group.Status = GroupBookingStatus.Expired;
            await _context.SaveChangesAsync();
        }
    }

    private async Task EnsureNoClassConflictAsync(Space space, DateTime start, DateTime end)
    {
        if (space.AllowReservationsDuringClasses)
            return;

        var dayOfWeek = (int)start.DayOfWeek;
        var startTime = start.TimeOfDay;
        var endTime = end.TimeOfDay;

        var conflict = await _context.ActivitySchedules
            .AnyAsync(s =>
                s.Activity.SpaceId == space.Id &&
                s.Activity.IsActive &&
                s.DayOfWeek == dayOfWeek &&
                s.StartTime < endTime &&
                startTime < s.EndTime);

        if (conflict)
            throw new AppValidationException("El turno seleccionado está ocupado por una Clase / Actividad del Club.");
    }

    private async Task<string> ResolveAliasAsync()
    {
        var config = await _paymentService.GetPayoutConfigAsync();
        return ResolveAlias(config.BankAlias);
    }

    private static string ResolveAlias(string? configured)
    {
        return string.IsNullOrWhiteSpace(configured)
            ? ClubConfigDefaults.DefaultBankAlias
            : configured.Trim();
    }

    private async Task TryNotifyAsync(int? userId, string title, string message, NotificationCategory category, string? referenceId = null)
    {
        try
        {
            await _notificationService.NotifyAsync(userId, title, message, category, referenceId);
        }
        catch
        {
            // La notificación es accesoria: no debe impedir la reserva.
        }
    }

    private static GroupBookingDto BuildDto(GroupBooking group, string transferAlias)
    {
        var participants = group.Participants
            .OrderBy(p => p.IsOrganizer ? 0 : 1)
            .ThenBy(p => p.Id)
            .Select(p => new GroupParticipantDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.DisplayName,
                Email = p.Email,
                IsOrganizer = p.IsOrganizer,
                Amount = p.Amount,
                Status = p.Status.ToString().ToUpperInvariant(),
                PaidAt = p.PaidAt
            })
            .ToList();

        return new GroupBookingDto
        {
            Id = group.Id,
            Token = group.Token,
            ResourceName = group.ResourceName,
            SpaceId = group.SpaceId,
            SpaceName = group.Space?.Name,
            OrganizerUserId = group.OrganizerUserId,
            OrganizerName = group.Organizer?.FullName ?? string.Empty,
            StartTime = group.StartTime,
            EndTime = group.EndTime,
            TotalAmount = group.TotalAmount,
            PerPersonAmount = group.PerPersonAmount,
            MarketplaceFee = group.MarketplaceFee,
            TotalParticipants = group.TotalParticipants,
            PaidCount = participants.Count(p => p.Status == "PAID"),
            Status = group.Status.ToString(),
            ExpiresAt = group.ExpiresAt,
            CompletedAt = group.CompletedAt,
            TransferAlias = transferAlias,
            Participants = participants
        };
    }

    private static string GenerateToken()
    {
        var prefix = RandomNumberGenerator.GetBytes(6);
        var suffix = RandomNumberGenerator.GetBytes(4);
        return $"GRP-{Convert.ToHexString(prefix).ToLowerInvariant()}-{Convert.ToHexString(suffix).ToLowerInvariant()}";
    }
}
