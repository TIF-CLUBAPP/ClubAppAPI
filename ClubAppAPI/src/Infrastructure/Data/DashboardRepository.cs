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
        var nextMonthStart = monthStart.AddMonths(1);

        // 1. Total absoluto de socios registrados (rol MEMBER en la tabla de usuarios)
        var totalSocios = await _context.Users
            .CountAsync(u => u.Role == UserRole.MEMBER && !u.IsDeleted);

        // 2. Nuevos socios registrados en el mes en curso (rol MEMBER) => altas del mes.
        var nuevosEsteMes = await _context.Users
            .CountAsync(u => u.Role == UserRole.MEMBER && !u.IsDeleted && u.CreatedAt >= monthStart);

        // 3. Socios activos: usuarios con al menos una membresía ACTIVE
        var sociosActivos = await _context.Memberships
            .Where(m => m.Status == MembershipStatus.ACTIVE)
            .Select(m => m.UserId)
            .Distinct()
            .CountAsync();

        // 4. No Socios (IsMember = false) que participan en actividades: usuarios con al
        //    menos una inscripción ACTIVA a una actividad, excluyendo a los socios.
        var noSociosEnActividades = await _context.Enrollments
            .Where(e => e.Status == EnrollmentStatus.ACTIVE && !e.User.IsMember)
            .Select(e => e.UserId)
            .Distinct()
            .CountAsync();

        // 5. Bajas del mes: usuarios con una membresía cancelada/vencida cuyo vencimiento
        //    (EndDate) cae dentro del mes en curso. Es el proxy disponible: no existe un
        //    timestamp explícito de "fecha de baja", así que usamos el fin del período pagado.
        var bajasEsteMes = await _context.Memberships
            .Where(m =>
                (m.Status == MembershipStatus.CANCELLED ||
                 m.Status == MembershipStatus.CANCELED_PENDING_END ||
                 m.Status == MembershipStatus.EXPIRED) &&
                m.EndDate >= monthStart && m.EndDate < nextMonthStart)
            .Select(m => m.UserId)
            .Distinct()
            .CountAsync();

        // 6. Recaudación del mes por CUOTAS: suma de TODOS los pagos acreditados
        //    (Paid) del mes en curso, sin importar el medio (Efectivo/Caja,
        //    Transferencia o Mercado Pago), excluyendo las cuotas de actividades
        //    (que se desglosan por separado en "Por Actividades").
        var recaudacionCuotas = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Paid
                        && p.Concepto == CuotaConcepto.CuotaSocial
                        && (p.PaymentDate != null ? p.PaymentDate >= monthStart : p.CreatedAt >= monthStart))
            .SumAsync(p => p.Amount + p.LateFeeApplied);

        // 7. Recaudación del mes por ACTIVIDADES: suma de los pagos acreditados de
        //    cuotas de actividad (Concepto == Actividad) cobrados por el Club en el mes.
        var recaudacionActividades = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Paid
                        && p.Concepto == CuotaConcepto.Actividad
                        && (p.PaymentDate != null ? p.PaymentDate >= monthStart : p.CreatedAt >= monthStart))
            .SumAsync(p => p.Amount + p.LateFeeApplied);

        var totalRecaudado = recaudacionCuotas + recaudacionActividades;

        // 8. Recaudación del mes (retrocompatible): equivalía a la recaudación por cuotas.
        var monthlyRevenue = recaudacionCuotas;

        // 9. Total emitido del mes (para calcular el % cobrado)
        var monthlyIssued = await _context.Payments
            .Where(p => p.PaymentDate >= monthStart)
            .SumAsync(p => p.Amount + p.LateFeeApplied);

        // 10. Cuotas vencidas: cantidad y monto total adeudado.
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
            NoSociosEnActividades = noSociosEnActividades,
            BajasEsteMes = bajasEsteMes,
            RecaudacionCuotas = recaudacionCuotas,
            RecaudacionActividades = recaudacionActividades,
            TotalRecaudado = totalRecaudado,
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
    /// Datos del panel "Control de Socios": flujo temporal de altas/bajas/neta,
    /// totales de socios vs no socios y métricas individuales por persona.
    /// </summary>
    public async Task<ControlSociosDto> GetControlSociosAsync(string rango)
    {
        var now = DateTime.UtcNow;
        var (desde, granularidad) = ResolverRango(rango);

        var sociosActivos = await _context.Memberships
            .Where(m => m.Status == MembershipStatus.ACTIVE)
            .Select(m => m.UserId).Distinct().CountAsync();

        var noSociosEnActividades = await _context.Enrollments
            .Where(e => e.Status == EnrollmentStatus.ACTIVE && !e.User.IsMember)
            .Select(e => e.UserId).Distinct().CountAsync();

        var altas = await _context.Users
            .CountAsync(u => !u.IsDeleted && u.CreatedAt >= desde);

        var bajas = await _context.Memberships
            .Where(m => (m.Status == MembershipStatus.CANCELLED ||
                         m.Status == MembershipStatus.CANCELED_PENDING_END ||
                         m.Status == MembershipStatus.EXPIRED) && m.EndDate >= desde)
            .Select(m => m.UserId).Distinct().CountAsync();

        var serie = await ConstruirSerieFlujoAsync(desde, granularidad);
        var personas = await ConstruirPersonasAsync();

        return new ControlSociosDto
        {
            SociosActivos = sociosActivos,
            NoSociosEnActividades = noSociosEnActividades,
            AltasMes = altas,
            BajasMes = bajas,
            SerieTemporal = serie,
            Personas = personas
        };
    }


    /// <summary>
    /// <summary>
    /// Datos del panel "Control de Recaudación": ingresos temporales desglosados
    /// por Cuotas, Alquileres y Actividades, con totales generales.
    /// </summary>
    public async Task<ControlRecaudacionDto> GetControlRecaudacionAsync(string rango)
    {
        var now = DateTime.UtcNow;
        var (desde, granularidad) = ResolverRango(rango);

        var pagosRango = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= desde)
            .Select(p => new {
                p.Amount, p.LateFeeApplied, p.Concepto,
                EsAlquiler = _context.ResourceBookings.Any(b => b.PaymentId == p.Id)
            })
            .ToListAsync();

        decimal totalCuotas = 0m;
        decimal totalAlquileres = 0m;
        decimal totalActividades = 0m;
        foreach (var p in pagosRango)
        {
            if (p.EsAlquiler) totalAlquileres += p.Amount + p.LateFeeApplied;
            else if (p.Concepto == CuotaConcepto.Actividad) totalActividades += p.Amount + p.LateFeeApplied;
            else totalCuotas += p.Amount + p.LateFeeApplied;
        }

        var serie = await ConstruirSerieIngresosAsync(desde, granularidad);

        return new ControlRecaudacionDto
        {
            TotalCuotas = totalCuotas,
            TotalAlquileres = totalAlquileres,
            TotalActividades = totalActividades,
            SerieTemporal = serie
        };
    }

    /// <summary>Resuelve el inicio del rango y la granularidad según el selector (dia/semana/mes/anio).</summary>
    private static (DateTime desde, string granularidad) ResolverRango(string rango)
    {
        var now = DateTime.UtcNow;
        return (rango ?? "mes").ToLowerInvariant() switch
        {
            "dia" => (now.Date, "hora"),
            "semana" => (now.Date.AddDays(-6), "dia"),
            "anio" => (new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc), "mes"),
            _ => (new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc), "dia"),
        };
    }

    private async Task<List<PuntoSerieDto>> ConstruirSerieFlujoAsync(DateTime desde, string granularidad)
    {
        var altasPorBucket = (await _context.Users
                .Where(u => !u.IsDeleted && u.CreatedAt >= desde)
                .ToListAsync())
            .GroupBy(u => ClaveBucket(u.CreatedAt, granularidad))
            .ToDictionary(g => g.Key, g => g.Count());

        var bajasPorBucket = (await _context.Memberships
                .Where(m => (m.Status == MembershipStatus.CANCELLED ||
                             m.Status == MembershipStatus.CANCELED_PENDING_END ||
                             m.Status == MembershipStatus.EXPIRED) && m.EndDate >= desde)
                .ToListAsync())
            .GroupBy(m => ClaveBucket(m.EndDate, granularidad))
            .ToDictionary(g => g.Key, g => g.Count());

        var claves = altasPorBucket.Keys.Union(bajasPorBucket.Keys).Distinct().OrderBy(c => c).ToList();
        return claves.Select(c => new PuntoSerieDto
        {
            Clave = c,
            Etiqueta = EtiquetaClave(c, granularidad),
            Altas = altasPorBucket.GetValueOrDefault(c),
            Bajas = bajasPorBucket.GetValueOrDefault(c)
        }).ToList();
    }

    private async Task<List<IngresoPeriodoDto>> ConstruirSerieIngresosAsync(DateTime desde, string granularidad)
    {
        var pagos = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= desde)
            .Select(p => new {
                p.Amount, p.LateFeeApplied, p.PaymentDate, p.Concepto,
                EsAlquiler = _context.ResourceBookings.Any(b => b.PaymentId == p.Id)
            })
            .ToListAsync();

        var porBucket = pagos
            .GroupBy(p => ClaveBucket(p.PaymentDate ?? DateTime.UtcNow, granularidad))
            .OrderBy(g => g.Key);

        var result = new List<IngresoPeriodoDto>();
        foreach (var g in porBucket)
        {
            decimal cuotas = 0, alquileres = 0, actividades = 0;
            foreach (var p in g)
            {
                if (p.EsAlquiler) alquileres += p.Amount + p.LateFeeApplied;
                else if (p.Concepto == CuotaConcepto.Actividad) actividades += p.Amount + p.LateFeeApplied;
                else cuotas += p.Amount + p.LateFeeApplied;
            }
            result.Add(new IngresoPeriodoDto
            {
                Clave = g.Key,
                Etiqueta = EtiquetaClave(g.Key, granularidad),
                Cuotas = cuotas,
                Alquileres = alquileres,
                Actividades = actividades
            });
        }
        return result;
    }

    private async Task<List<PersonaMetricaDto>> ConstruirPersonasAsync()
    {
        var alquileres = (await _context.ResourceBookings
                .Where(b => b.Status == BookingStatus.Confirmed)
                .Select(b => new { b.UserId, b.User.FullName, b.User.IsMember })
                .ToListAsync())
            .GroupBy(b => new { b.UserId, b.FullName, b.IsMember })
            .ToDictionary(g => g.Key, g => g.Count());

        var actividades = (await _context.Enrollments
                .Where(e => e.Status == EnrollmentStatus.ACTIVE)
                .Select(e => new { e.UserId, e.User.FullName, e.User.IsMember })
                .ToListAsync())
            .GroupBy(e => new { e.UserId, e.FullName, e.IsMember })
            .ToDictionary(g => g.Key, g => g.Count());

        var claves = alquileres.Keys.Union(actividades.Keys);
        return claves
            .Select(k => new PersonaMetricaDto
            {
                UserId = k.UserId,
                FullName = string.IsNullOrWhiteSpace(k.FullName) ? $"Usuario #{k.UserId}" : k.FullName,
                EsSocio = k.IsMember,
                Alquileres = alquileres.GetValueOrDefault(k),
                Actividades = actividades.GetValueOrDefault(k)
            })
            .OrderByDescending(p => p.Alquileres + p.Actividades)
            .ToList();
    }

    private static string ClaveBucket(DateTime fecha, string granularidad) => granularidad switch
    {
        "hora" => fecha.ToString("yyyy-MM-dd-HH"),
        "mes" => fecha.ToString("yyyy-MM"),
        _ => fecha.ToString("yyyy-MM-dd"),
    };

    private static string EtiquetaClave(string clave, string granularidad) => granularidad switch
    {
        "hora" when clave.Length >= 13 => clave.Substring(11, 2) + "h",
        "mes" when clave.Length >= 7 => clave.Substring(5, 2) + "/" + clave.Substring(0, 4),
        _ => clave.Length >= 10 ? clave.Substring(8, 2) + "/" + clave.Substring(5, 2) : clave,
    };

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
