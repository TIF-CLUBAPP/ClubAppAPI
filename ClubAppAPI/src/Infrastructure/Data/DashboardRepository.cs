using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Data;

public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationContext _context;

    public DashboardRepository(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // 1. Total absoluto de socios registrados (rol MEMBER en la tabla de usuarios)
        var totalSocios = await _context.Users
            .CountAsync(u => u.Role == UserRole.MEMBER);

        // 2. Nuevos socios registrados en el mes en curso (rol MEMBER)
        var nuevosEsteMes = await _context.Users
            .CountAsync(u => u.Role == UserRole.MEMBER && u.CreatedAt >= monthStart);

        // 3. Socios activos: usuarios con al menos una membresía ACTIVE
        var sociosActivos = await _context.Memberships
            .Where(m => m.Status == MembershipStatus.ACTIVE)
            .Select(m => m.UserId)
            .Distinct()
            .CountAsync();

        // 4. Recaudación del mes: suma de pagos Paid del mes en curso.
        var monthlyRevenue = await _context.Payments
            .Where(p => p.PaymentDate >= monthStart && p.Status == PaymentStatus.Paid)
            .SumAsync(p => p.Amount + p.LateFeeApplied);

        // 5. Total emitido del mes (para calcular el % cobrado)
        var monthlyIssued = await _context.Payments
            .Where(p => p.PaymentDate >= monthStart)
            .SumAsync(p => p.Amount + p.LateFeeApplied);

        // 6. Cuotas vencidas: cantidad y monto total adeudado.
        //    Se consideran Overdue o Pending (misma regla que /api/cuotas/vencidas).
        var overduePayments = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Pending)
            .Select(p => new { p.Amount, p.LateFeeApplied })
            .ToListAsync();

        var cuotasVencidas = overduePayments.Count;
        var montoTotalDeuda = overduePayments.Sum(p => p.Amount + p.LateFeeApplied);

        var collectedPercentage = monthlyIssued > 0
            ? Math.Round(monthlyRevenue / monthlyIssued * 100m, 0)
            : 0m;

        return new DashboardStatsDto
        {
            SociosActivos = sociosActivos,
            TotalSocios = totalSocios,
            NuevosEsteMes = nuevosEsteMes,
            MonthlyRevenue = monthlyRevenue,
            CollectedPercentage = collectedPercentage,
            CuotasVencidas = cuotasVencidas,
            MontoTotalDeuda = montoTotalDeuda
        };
    }

    public async Task<List<SectorStatusDto>> GetSectorsAsync()
    {
        var now = DateTime.Now;
        var today = now.Date;
        var todayEnd = today.AddDays(1);
        var dayOfWeek = (int)now.DayOfWeek;
        var nowTime = now.TimeOfDay;

        var spaces = await _context.Spaces.OrderBy(s => s.Name).ToListAsync();

        var todaySchedules = await _context.ActivitySchedules
            .Where(s => s.Activity.IsActive && s.Activity.SpaceId != null && s.DayOfWeek == dayOfWeek)
            .Select(s => new { s.Id, s.ActivityId, s.StartTime, s.EndTime, SpaceId = s.Activity.SpaceId, s.Activity.MaxCapacity })
            .ToListAsync();

        var enrollmentRows = await _context.Enrollments
            .Where(e => e.Status == EnrollmentStatus.ACTIVE)
            .GroupBy(e => e.ActivityId)
            .Select(g => new { ActivityId = g.Key, Count = g.Count() })
            .ToListAsync();

        var enrollmentCounts = enrollmentRows.ToDictionary(x => x.ActivityId, x => x.Count);

        var todayBookings = await _context.ResourceBookings
            .Where(b => b.Status != BookingStatus.Cancelled && b.SpaceId != null
                        && b.StartTime < todayEnd && b.EndTime > today)
            .Select(b => new { b.Id, b.SpaceId, b.StartTime, b.EndTime, b.Status })
            .ToListAsync();

        var groupRows = await _context.GroupBookings
            .Where(g => g.ResourceBookingId != null && g.SpaceId != null
                        && g.StartTime < todayEnd && g.EndTime > today
                        && g.Status != GroupBookingStatus.Cancelled && g.Status != GroupBookingStatus.Expired)
            .Select(g => new { g.ResourceBookingId, g.TotalParticipants })
            .ToListAsync();

        var bookingParticipants = new Dictionary<int, int>();
        foreach (var g in groupRows)
        {
            if (g.ResourceBookingId.HasValue)
                bookingParticipants[g.ResourceBookingId.Value] = g.TotalParticipants;
        }

        var result = new List<SectorStatusDto>();

        foreach (var space in spaces)
        {
            var maintenance = !space.IsActive;

            var runningSchedules = todaySchedules
                .Where(s => s.SpaceId == space.Id && s.StartTime <= nowTime && nowTime < s.EndTime)
                .ToList();

            var currentBookings = todayBookings
                .Where(b => b.SpaceId == space.Id && b.Status == BookingStatus.Confirmed
                            && b.StartTime <= now && now < b.EndTime)
                .ToList();

            var occupancy = 0;
            int? capacity = null;

            foreach (var sched in runningSchedules)
            {
                occupancy += enrollmentCounts.TryGetValue(sched.ActivityId, out var c) ? c : 0;
                if (sched.MaxCapacity > 0)
                    capacity = capacity.HasValue ? Math.Max(capacity.Value, sched.MaxCapacity) : sched.MaxCapacity;
            }

            foreach (var booking in currentBookings)
            {
                var participants = bookingParticipants.TryGetValue(booking.Id, out var p) && p > 0 ? p : 1;
                occupancy += participants;
                if (!capacity.HasValue || participants > capacity.Value)
                    capacity = participants;
            }

            var status = maintenance ? "maintenance" : (occupancy > 0 ? "occupied" : "available");

            TimeSpan? earliest = null;

            var nextSchedule = todaySchedules
                .Where(s => s.SpaceId == space.Id && s.StartTime > nowTime)
                .OrderBy(s => s.StartTime)
                .FirstOrDefault();
            if (nextSchedule != null)
                earliest = nextSchedule.StartTime;

            var nextBooking = todayBookings
                .Where(b => b.SpaceId == space.Id && b.StartTime > now)
                .OrderBy(b => b.StartTime)
                .FirstOrDefault();
            if (nextBooking != null)
            {
                var t = nextBooking.StartTime.TimeOfDay;
                if (!earliest.HasValue || t < earliest.Value)
                    earliest = t;
            }

            result.Add(new SectorStatusDto
            {
                Id = space.Id,
                Name = space.Name,
                SportCategory = space.SportCategory,
                Location = space.Location,
                IsReservable = IsMemberReservable(space),
                Status = status,
                CurrentOccupancy = occupancy,
                Capacity = capacity,
                NextTurn = earliest.HasValue
                    ? new DateTime(2000, 1, 1).Add(earliest.Value).ToString("HH:mm")
                    : null
            });
        }

        return result;
    }

    /// <summary>
    /// Categorías puramente institucionales del club: no admiten alquiler/reserva
    /// particular de socios, por más que el espacio esté activo.
    /// </summary>
    private static readonly HashSet<string> NonReservableCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "Gimnasio / Musculación",
        "Natación (Piscina)",
        "SUM / Salón de Eventos",
        "Quincho / Parrilla"
    };

    /// <summary>
    /// Un espacio admite reservas particulares de socios por defecto, salvo que:
    /// - esté inactivo (mantenimiento), o
    /// - pertenezca a una categoría puramente institucional (gimnasio, piscina, SUM, quincho).
    /// </summary>
    private static bool IsMemberReservable(Space space)
    {
        if (!space.IsActive)
            return false;

        if (NonReservableCategories.Contains(space.SportCategory))
            return false;

        return true;
    }
}
