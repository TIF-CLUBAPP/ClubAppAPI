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

    /// <summary>
    /// Calcula el primer día del mes siguiente (UTC). La nueva tarifa rige desde esa fecha,
    /// de modo que las cuotas y deudas ya emitidas del mes en curso no se modifican.
    /// </summary>
    private static DateTime CalcularVigenciaProximoMes(DateTime? now = null)
    {
        var baseDate = now ?? DateTime.UtcNow;
        return new DateTime(baseDate.Year, baseDate.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
    }

    public async Task<FeeSettingsDto> GetFeeSettingsAsync()
    {
        // La tarifa vigente es la fila marcada como actual; si no existe,
        // se toma la más reciente por fecha de vigencia.
        var settings = await _context.FeeSettings
            .Where(f => f.IsCurrent)
            .OrderByDescending(f => f.EffectiveFromDate)
            .FirstOrDefaultAsync()
            ?? await _context.FeeSettings
                .OrderByDescending(f => f.EffectiveFromDate)
                .FirstOrDefaultAsync();

        if (settings == null)
        {
            return new FeeSettingsDto
            {
                BaseFeeAmount = 0,
                LateFeePercentage = 10,
                DueDayOfMonth = 10,
                EffectiveFromDate = null,
                PendingEffectiveFromDate = null
            };
        }

        // Si el último cambio registrado aún no entró en vigencia (fecha futura),
        // se informa como pendiente sin aplicarlo todavía.
        var ultimoCambio = await _context.FeeSettingsHistory
            .OrderByDescending(h => h.ChangedAt)
            .FirstOrDefaultAsync();

        DateTime? pendiente = null;
        if (ultimoCambio != null && ultimoCambio.EffectiveFromDate > DateTime.UtcNow)
        {
            pendiente = ultimoCambio.EffectiveFromDate;
        }

        return new FeeSettingsDto
        {
            BaseFeeAmount = settings.BaseFeeAmount,
            LateFeePercentage = settings.LateFeePercentage,
            DueDayOfMonth = settings.DueDayOfMonth,
            EffectiveFromDate = settings.EffectiveFromDate,
            PendingEffectiveFromDate = pendiente
        };
    }

    public async Task<FeeSettingsDto> UpdateFeeSettingsAsync(UpdateFeeSettingsDto dto, int? changedByUserId = null)
    {
        var vigencia = CalcularVigenciaProximoMes();

        var actual = await _context.FeeSettings
            .Where(f => f.IsCurrent)
            .OrderByDescending(f => f.EffectiveFromDate)
            .FirstOrDefaultAsync();

        if (actual == null)
        {
            actual = new FeeSettings
            {
                BaseFeeAmount = 0m,
                LateFeePercentage = 10m,
                DueDayOfMonth = 10,
                EffectiveFromDate = null,
                IsCurrent = true
            };
            _context.FeeSettings.Add(actual);
        }

        // 1) Archivar SIEMPRE la tarifa anterior en el historial (no se pierde ni se sobrescribe).
        _context.FeeSettingsHistory.Add(new FeeSettingsHistory
        {
            PreviousBaseFeeAmount = actual.BaseFeeAmount,
            PreviousLateFeePercentage = actual.LateFeePercentage,
            PreviousDueDayOfMonth = actual.DueDayOfMonth,
            NewBaseFeeAmount = dto.BaseFeeAmount,
            NewLateFeePercentage = dto.LateFeePercentage,
            NewDueDayOfMonth = dto.DueDayOfMonth,
            EffectiveFromDate = vigencia,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = changedByUserId,
            Notes = $"Nueva tarifa vigente desde {vigencia:yyyy-MM-dd}."
        });

        // 2) La fila actual deja de ser la vigente y se crea una nueva con EffectiveFromDate.
        actual.IsCurrent = false;

        var nueva = new FeeSettings
        {
            BaseFeeAmount = dto.BaseFeeAmount,
            LateFeePercentage = dto.LateFeePercentage,
            DueDayOfMonth = dto.DueDayOfMonth,
            EffectiveFromDate = vigencia,
            IsCurrent = true
        };
        _context.FeeSettings.Add(nueva);

        await _context.SaveChangesAsync();

        return new FeeSettingsDto
        {
            BaseFeeAmount = nueva.BaseFeeAmount,
            LateFeePercentage = nueva.LateFeePercentage,
            DueDayOfMonth = nueva.DueDayOfMonth,
            EffectiveFromDate = nueva.EffectiveFromDate,
            PendingEffectiveFromDate = vigencia
        };
    }

    public async Task<List<FeeSettingsHistoryDto>> GetFeeSettingsHistoryAsync()
    {
        return await _context.FeeSettingsHistory
            .OrderByDescending(h => h.EffectiveFromDate)
            .ThenByDescending(h => h.Id)
            .Select(h => new FeeSettingsHistoryDto
            {
                Id = h.Id,
                PreviousBaseFeeAmount = h.PreviousBaseFeeAmount,
                PreviousLateFeePercentage = h.PreviousLateFeePercentage,
                PreviousDueDayOfMonth = h.PreviousDueDayOfMonth,
                NewBaseFeeAmount = h.NewBaseFeeAmount,
                NewLateFeePercentage = h.NewLateFeePercentage,
                NewDueDayOfMonth = h.NewDueDayOfMonth,
                EffectiveFromDate = h.EffectiveFromDate,
                ChangedAt = h.ChangedAt,
                ChangedByUserId = h.ChangedByUserId,
                Notes = h.Notes
            })
            .ToListAsync();
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

    /// <summary>
    /// Cobro parcial: registra el pago únicamente de las cuotas indicadas,
    /// dejando el resto en estado impago. Devuelve el resumen del cobro.
    /// </summary>
    public async Task<RegistrarPagoParcialResult> RegistrarPagoParcialAsync(IEnumerable<int> cuotaIds)
    {
        var ids = cuotaIds?.Distinct().ToList() ?? new List<int>();
        var resultado = new RegistrarPagoParcialResult();

        if (ids.Count == 0) return resultado;

        var payments = await _context.Payments
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var userIdsAfectados = new HashSet<int>();

        foreach (var payment in payments)
        {
            if (payment.Status == PaymentStatus.Paid)
            {
                resultado.CuotasOmitidas++;
                continue;
            }

            payment.Status = PaymentStatus.Paid;
            payment.PaymentDate = now;

            resultado.CuotasPagadas++;
            resultado.MontoTotal += payment.Amount;
            userIdsAfectados.Add(payment.UserId);
        }

        if (resultado.CuotasPagadas > 0)
        {
            // Reactivar la membresía de los socios que regularizaron al menos una cuota.
            var memberships = await _context.Memberships
                .Where(m => userIdsAfectados.Contains(m.UserId))
                .ToListAsync();
            foreach (var membership in memberships)
            {
                membership.Status = MembershipStatus.ACTIVE;
            }

            var users = await _context.Users
                .Where(u => userIdsAfectados.Contains(u.Id))
                .ToListAsync();
            foreach (var user in users)
            {
                user.LastPaymentDate = now;
            }

            await _context.SaveChangesAsync();
        }

        return resultado;
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
