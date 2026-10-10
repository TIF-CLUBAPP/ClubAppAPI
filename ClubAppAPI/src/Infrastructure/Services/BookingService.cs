using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Constants;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationContext _context;
    private readonly IPaymentService _paymentService;
    private readonly INotificationService _notificationService;

    public BookingService(ApplicationContext context, IPaymentService paymentService, INotificationService notificationService)
    {
        _context = context;
        _paymentService = paymentService;
        _notificationService = notificationService;
    }

    public async Task<List<BookingDto>> GetBookingsByDateAsync(DateTime date)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var bookings = await _context.ResourceBookings
            .Include(b => b.User)
            .Include(b => b.Payment)
            .Include(b => b.Space)
            .Where(b => b.Status != BookingStatus.Cancelled && b.StartTime >= dayStart && b.StartTime < dayEnd)
            .OrderBy(b => b.StartTime)
            .ToListAsync();

        return bookings.Select(Map).ToList();
    }

    public async Task<List<BookingDto>> GetMyBookingsAsync(int userId)
    {
        var bookings = await _context.ResourceBookings
            .Include(b => b.User)
            .Include(b => b.Payment)
            .Include(b => b.Space)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.StartTime)
            .ToListAsync();

        return bookings.Select(Map).ToList();
    }

    public async Task<BookingDto> CreateBookingAsync(int userId, CreateBookingRequest dto)
    {
        if (dto.StartTime >= dto.EndTime)
            throw new AppValidationException("El horario de fin debe ser posterior al de inicio.");

        if (dto.Amount < 0)
            throw new AppValidationException("El monto no puede ser negativo.");

        // Rechaza reservas cuyo inicio ya quedó en el pasado (evita "colar" turnos vencidos).
        if (dto.StartTime.ToUniversalTime() < DateTime.UtcNow)
            throw new AppValidationException("No se pueden realizar reservas en horarios pasados.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new NotFoundException("User", userId);

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

        // Regla de comisión ATRIO (idéntica a PaymentService): min(monto * %, tope).
        var config = await _paymentService.GetPayoutConfigAsync();
        var percentage = config.ApplicationFeePercentage > 0
            ? config.ApplicationFeePercentage
            : ClubConfigDefaults.DefaultApplicationFeePercentage;
        var cap = config.MaxApplicationFeeAmount > 0
            ? config.MaxApplicationFeeAmount
            : ClubConfigDefaults.DefaultMaxApplicationFeeAmount;

        var rawFee = dto.Amount * (percentage / 100m);
        var fee = Math.Min(rawFee, cap);
        fee = Math.Round(fee, 2, MidpointRounding.AwayFromZero);
        if (fee < 0) fee = 0;

        // El Período se genera único para no chocar con el índice único (UserId, Period).
        var payment = new Payment
        {
            UserId = userId,
            Period = $"R{dto.StartTime:yyyyMMddHHmmss}",
            Amount = dto.Amount,
            LateFeeApplied = 0m,
            MarketplaceFee = fee,
            Status = PaymentStatus.Pending,
            PaymentMethod = "RESERVA",
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);

        var booking = new ResourceBooking
        {
            ResourceName = resourceName,
            SpaceId = dto.SpaceId,
            UserId = userId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = space?.RequiresApproval == true
                ? BookingStatus.PendingApproval
                : BookingStatus.PendingPayment,
            CreatedAt = DateTime.UtcNow
        };
        _context.ResourceBookings.Add(booking);
        await _context.SaveChangesAsync();

        booking.PaymentId = payment.Id;
        await _context.SaveChangesAsync();

        var alias = string.IsNullOrWhiteSpace(config.BankAlias)
            ? ClubConfigDefaults.DefaultBankAlias
            : config.BankAlias.Trim();

        return new BookingDto
        {
            Id = booking.Id,
            ResourceName = booking.ResourceName,
            SpaceId = booking.SpaceId,
            SpaceName = space?.Name,
            UserId = userId,
            UserName = user.FullName,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status.ToString(),
            PaymentId = payment.Id,
            Amount = dto.Amount,
            MarketplaceFee = fee,
            TotalAmount = dto.Amount + fee,
            TransferAlias = alias,
            PayoutCollector = "Club"
        };
    }

    public async Task<bool> ConfirmBookingAsync(int bookingId, int userId)
    {
        var booking = await _context.ResourceBookings.FindAsync(bookingId);
        if (booking == null) throw new NotFoundException("ResourceBooking", bookingId);
        if (booking.UserId != userId) throw new NotAllowedException("No podés confirmar una reserva de otra persona.");

        if (booking.Status == BookingStatus.Confirmed) return true;

        booking.Status = BookingStatus.Confirmed;
        await _context.SaveChangesAsync();

        await TryNotifyAsync(booking.UserId,
            "Reserva confirmada",
            $"Tu reserva de {booking.ResourceName} fue confirmada.",
            NotificationCategory.Booking,
            booking.Id.ToString());

        return true;
    }

    public async Task<bool> CancelBookingAsync(int bookingId, int userId)
    {
        var booking = await _context.ResourceBookings.FindAsync(bookingId);
        if (booking == null) throw new NotFoundException("ResourceBooking", bookingId);
        if (booking.UserId != userId) throw new NotAllowedException("No podés cancelar una reserva de otra persona.");

        booking.Status = BookingStatus.Cancelled;
        await _context.SaveChangesAsync();
        return true;
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

    private async Task TryNotifyAsync(int? userId, string title, string message, NotificationCategory category, string? referenceId = null)
    {
        try
        {
            await _notificationService.NotifyAsync(userId, title, message, category, referenceId);
        }
        catch
        {
            // La notificación es accesoria: no debe impedir la confirmación de la reserva.
        }
    }

    private static BookingDto Map(ResourceBooking b)
    {
        var amount = b.Payment?.Amount ?? 0m;
        var fee = b.Payment?.MarketplaceFee ?? 0m;

        return new BookingDto
        {
            Id = b.Id,
            ResourceName = b.ResourceName,
            SpaceId = b.SpaceId,
            SpaceName = b.Space?.Name,
            UserId = b.UserId,
            UserName = b.User?.FullName ?? string.Empty,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            Status = b.Status.ToString(),
            PaymentId = b.PaymentId,
            Amount = amount,
            MarketplaceFee = fee,
            TotalAmount = amount + fee,
            TransferAlias = string.Empty,
            PayoutCollector = "Club"
        };
    }
}