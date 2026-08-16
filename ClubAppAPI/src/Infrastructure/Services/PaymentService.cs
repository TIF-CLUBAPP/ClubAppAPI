using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;
using System.Globalization;

namespace ClubApp.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationContext _context;

    public PaymentService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Payment>> GetAllPaymentsAsync()
    {
        var payments = await _context.Payments
            .Include(p => p.User)
            .ToListAsync();

        CheckAndUpdateOverdueStatus(payments);
        await _context.SaveChangesAsync();

        return payments;
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        var payment = await _context.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment != null)
        {
            CheckAndUpdateOverdueStatus(new[] { payment });
            await _context.SaveChangesAsync();
        }

        return payment;
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId)
    {
        var payments = await _context.Payments
            .Include(p => p.User)
            .Where(p => p.UserId == userId) 
            .ToListAsync();

        CheckAndUpdateOverdueStatus(payments);
        await _context.SaveChangesAsync();

        return payments;
    }

    public async Task<Payment> CreatePaymentAsync(int loggedInUserId, string loggedInUserRole, CreatePaymentDto dto)
    {
        var membership = await _context.Memberships.FindAsync(dto.MembershipId);
        if (membership == null)
            throw new NotFoundException($"No se encontro la membresia con ID {dto.MembershipId}.");

        if (loggedInUserRole != "ADMIN" && loggedInUserRole != "SUPERADMIN" && membership.UserId != loggedInUserId)
        {
            throw new NotAllowedException("No tienes permisos para pagar esta membresia.");
        }

        // dto.PaymentMethod es int (0 = MERCADOPAGO, 1 = CASH)
        var methodName = dto.PaymentMethod == 0 ? "MERCADOPAGO" : "CASH";

        var payment = new Payment
        {
            UserId = membership.UserId,
            Period = $"{DateTime.UtcNow:MM/yyyy}",
            Amount = membership.MonthlyPrice,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = methodName,
            Status = (dto.PaymentMethod == 1 && (loggedInUserRole == "ADMIN" || loggedInUserRole == "SUPERADMIN")) 
                        ? PaymentStatus.Paid 
                        : PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        if (payment.Status == PaymentStatus.Paid)
        {
            membership.Status = MembershipStatus.ACTIVE;
        }

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync(); 
        return payment;
    }

    public async Task<string> UpdateStatusAsync(int paymentId, PaymentStatus newStatus)
    {
        var payment = await _context.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null) return "NOT_FOUND";

        if (newStatus == PaymentStatus.Paid)
        {
            payment.PaymentDate = DateTime.UtcNow;
            var membership = await _context.Memberships
                .FirstOrDefaultAsync(m => m.UserId == payment.UserId);
            if (membership != null)
                membership.Status = MembershipStatus.ACTIVE;
        }

        payment.Status = newStatus;
        await _context.SaveChangesAsync();
        return "OK";
    }

// ========== Configuración de cuotas (FeeSettings) ==========

    public async Task<FeeSettingsDto> GetFeeSettingsAsync()
    {
        var settings = await _context.FeeSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            return new FeeSettingsDto { BaseFeeAmount = 0, LateFeePercentage = 10, DueDayOfMonth = 10 };
        }

        return new FeeSettingsDto
        {
            BaseFeeAmount = settings.BaseFeeAmount,
            LateFeePercentage = settings.LateFeePercentage,
            DueDayOfMonth = settings.DueDayOfMonth
        };
    }

    public async Task<FeeSettingsDto> UpdateFeeSettingsAsync(UpdateFeeSettingsDto dto)
    {
        var settings = await _context.FeeSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new FeeSettings();
            _context.FeeSettings.Add(settings);
        }

        settings.BaseFeeAmount = dto.BaseFeeAmount;
        settings.LateFeePercentage = dto.LateFeePercentage;
        settings.DueDayOfMonth = dto.DueDayOfMonth;

        await _context.SaveChangesAsync();

        return new FeeSettingsDto
        {
            BaseFeeAmount = settings.BaseFeeAmount,
            LateFeePercentage = settings.LateFeePercentage,
            DueDayOfMonth = settings.DueDayOfMonth
        };
    }
    // ========== Exenciones ==========

    public async Task<ExemptionsResponseDto> GetExemptionsAsync()
    {
        var exemptUsers = await _context.Users
            .Where(u => u.IsExemptFromFees && !u.IsDeleted)
            .Select(u => new UserExemptionDto
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsExemptFromFees = u.IsExemptFromFees
            }).ToListAsync();

        var roleConfigs = await _context.RoleConfigurations
            .Select(r => new RoleExemptionDto
            {
                Role = r.Role.ToString(),
                AreFeesExempt = r.AreFeesExempt,
                Description = r.Description
            }).ToListAsync();

        return new ExemptionsResponseDto
        {
            Users = exemptUsers,
            Roles = roleConfigs
        };
    }

    public async Task<UserExemptionDto?> ToggleUserExemptionAsync(int userId, bool isExempt)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        user.IsExemptFromFees = isExempt;
        await _context.SaveChangesAsync();

        return new UserExemptionDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsExemptFromFees = user.IsExemptFromFees
        };
    }

    public async Task<RoleExemptionDto?> ToggleRoleExemptionAsync(string roleName, bool areFeesExempt)
    {
        if (!Enum.TryParse<UserRole>(roleName, true, out var roleEnum))
            return null;

        var roleConfig = await _context.RoleConfigurations
            .FirstOrDefaultAsync(rc => rc.Role == roleEnum);

        if (roleConfig == null)
        {
            roleConfig = new RoleConfiguration 
            { 
                Role = roleEnum,
                AreFeesExempt = areFeesExempt 
            };
            _context.RoleConfigurations.Add(roleConfig);
        }
        else
        {
            roleConfig.AreFeesExempt = areFeesExempt;
        }

        await _context.SaveChangesAsync();

        return new RoleExemptionDto
        {
            Role = roleConfig.Role.ToString(),
            AreFeesExempt = roleConfig.AreFeesExempt,
            Description = roleConfig.Description
        };
    }

    // ========== Listado de pagos con filtros ==========

    public async Task<PagedPaymentsResponseDto> GetPaymentsAsync(PaymentFilterDto filter)
    {
        var query = _context.Payments.Include(p => p.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (Enum.TryParse<PaymentStatus>(filter.Status, true, out var status))
                query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(filter.Period))
        {
            query = query.Where(p => p.Period == filter.Period);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(p => p.User.FirstName.ToLower().Contains(search) ||
                                     p.User.LastName.ToLower().Contains(search) ||
                                     p.User.Email.ToLower().Contains(search) ||
                                     p.User.Dni.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedPaymentsResponseDto
        {
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            Payments = payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Amount = p.Amount + p.LateFeeApplied,
                Method = p.PaymentMethod,
                Status = p.Status.ToString().ToUpper(),
                PaymentDate = p.PaymentDate ?? DateTime.MinValue
            }).ToList()
        };
    }

    // ========== Registro manual de pago ==========

    public async Task<PaymentDto?> RegisterPaymentAsync(RegisterPaymentDto dto)
    {
        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null) return null;

        var payment = new Payment
        {
            UserId = dto.UserId,
            Period = dto.Period,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            Status = PaymentStatus.Paid,
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.UserId == dto.UserId);
        if (membership != null)
        {
            membership.Status = MembershipStatus.ACTIVE;
        }

        user.LastPaymentDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new PaymentDto
        {
            Id = payment.Id,
            UserId = payment.UserId,
            MembershipId = membership?.Id ?? 0,
            Amount = payment.Amount,
            Method = payment.PaymentMethod,
            Status = payment.Status.ToString().ToUpper(),
            PaymentDate = payment.PaymentDate ?? DateTime.MinValue
        };
    }
    private static void CheckAndUpdateOverdueStatus(IEnumerable<Payment> payments)
    {
        foreach (var payment in payments)
        {
            // Nota: la logica de vencimiento por fecha se reimplementara en el Paso 2
            // con FeeSettings + DueDayOfMonth. Por ahora solo se mantiene el estado.
            _ = payment;
        }
    }

    // ==============================================================
    // Cuotas vencidas / Gestion de deudores
    // ==============================================================

    public async Task<CuotasVencidasStatsDto> GetOverdueCuotasStatsAsync()
    {
        var overdue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Pending)
            .Select(p => new { p.Amount, p.LateFeeApplied })
            .ToListAsync();

        return new CuotasVencidasStatsDto
        {
            TotalCuotasVencidas = overdue.Count,
            MontoTotalDeuda = overdue.Sum(p => p.Amount + p.LateFeeApplied)
        };
    }

    public async Task<List<CuotaVencidaDto>> GetOverdueCuotasListAsync()
    {
        var overduePayments = await _context.Payments
            .Include(p => p.User)
            .Where(p => p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Pending)
            .OrderBy(p => p.User.LastName)
            .ThenBy(p => p.User.FirstName)
            .ThenBy(p => p.Period)
            .ToListAsync();

        return overduePayments
            .GroupBy(p => p.UserId)
            .Select(g =>
            {
                var user = g.First().User;
                var totalAdeudado = g.Sum(p => p.Amount + p.LateFeeApplied);

                return new CuotaVencidaDto
                {
                    SocioId = user.Id,
                    Nombre = user.FirstName,
                    Apellido = user.LastName,
                    Email = user.Email,
                    Telefono = user.Phone,
                    Dni = user.Dni,
                    CantidadCuotasImpagas = g.Count(),
                    PeriodosVencidos = g
                        .OrderBy(p => p.Period)
                        .Select(p => FormatPeriodo(p.Period, p.CreatedAt))
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .ToList(),
                    MontoTotalAdeudado = totalAdeudado,
                    DiasDeAtraso = 0,
                    PaymentIds = g.Select(p => p.Id).OrderBy(id => id).ToList()
                };
            })
            .OrderByDescending(d => d.MontoTotalAdeudado)
            .ToList();
    }

    public async Task<string> RegistrarPagoAsync(int cuotaId)
    {
        var payment = await _context.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == cuotaId);

        if (payment == null) return "NOT_FOUND";
        if (payment.Status == PaymentStatus.Paid) return "ALREADY_PAID";

        var now = DateTime.UtcNow;

        payment.Status = PaymentStatus.Paid;
        payment.PaymentDate = now;

        var membership = await _context.Memberships
            .FirstOrDefaultAsync(m => m.UserId == payment.UserId);
        if (membership != null)
        {
            membership.Status = MembershipStatus.ACTIVE;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == payment.UserId);
        if (user != null)
        {
            user.LastPaymentDate = now;
        }

        await _context.SaveChangesAsync();
        return "OK";
    }

    // Ej: "Julio 2026"
    private static string FormatPeriodo(string period, DateTime? fallbackDate = null)
    {
        // period = "yyyy-MM" (formato estándar ISO) o "MM/yyyy" (legacy) o "Mes Año" (legacy)
        bool hasValidPeriod = !string.IsNullOrWhiteSpace(period) && period.Length >= 7;

        if (hasValidPeriod)
        {
            int month = 0, year = 0;
            
            // Intentar parsear como "yyyy-MM" (nuevo formato estándar)
            if (period.Contains("-") && int.TryParse(period.AsSpan(0, 4), out year) && int.TryParse(period.AsSpan(5, 2), out month))
            {
                var culture = CultureInfo.GetCultureInfo("es-AR");
                var monthName = culture.DateTimeFormat.GetMonthName(month);
                var capitalized = char.ToUpperInvariant(monthName[0]) + monthName.Substring(1);
                return $"{capitalized} {year}";
            }
            
            // Intentar parsear como "MM/yyyy" (legacy)
            if (period.Contains("/") && int.TryParse(period.AsSpan(0, 2), out month) && int.TryParse(period.AsSpan(3, 4), out year))
            {
                var culture = CultureInfo.GetCultureInfo("es-AR");
                var monthName = culture.DateTimeFormat.GetMonthName(month);
                var capitalized = char.ToUpperInvariant(monthName[0]) + monthName.Substring(1);
                return $"{capitalized} {year}";
            }
            
            // Si ya está en formato "Mes Año" (longitud > 7), devolver tal cual
            if (period.Length > 7)
            {
                return period;
            }
        }

        // Si no hay período válido, generar desde fallbackDate (CreatedAt o DueDate)
        if (fallbackDate.HasValue)
        {
            var culture = CultureInfo.GetCultureInfo("es-AR");
            var monthName = culture.DateTimeFormat.GetMonthName(fallbackDate.Value.Month);
            var capitalized = char.ToUpperInvariant(monthName[0]) + monthName.Substring(1);
            return $"{capitalized} {fallbackDate.Value.Year}";
        }

        return "Adeuda cuota";
    }
}
