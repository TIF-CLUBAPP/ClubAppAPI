using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Models;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Constants;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;
using System.Globalization;
using System.Linq;
using MercadoPago.Config;
using MercadoPago.Client.Preference;
using MercadoPago.Client.Payment;
using MercadoPago.Resource.Preference;
using MercadoPago.Error;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ClubApp.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationContext _context;
    private readonly IConfiguration _configuration;
    public PaymentService(ApplicationContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string> ProcessMercadoPagoWebhookAsync(string payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
            return "BAD_REQUEST";

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(payloadJson);
            var root = doc.RootElement;

            // Formato típico: { resource: { status, external_reference, ... } }
            if (root.TryGetProperty("resource", out var resource))
                root = resource;

            if (!root.TryGetProperty("status", out var statusElement))
                return "NO_STATUS";

            var status = statusElement.GetString();
            // Extraer paymentId desde el payload (Mercado Pago suele enviarlo como data.id o id).
            string? paymentId = null;
            if (root.TryGetProperty("data", out var dataElement))
            {
                if (dataElement.TryGetProperty("id", out var dataId))
                    paymentId = dataId.GetString();
            }
            
            if (string.IsNullOrWhiteSpace(paymentId) && root.TryGetProperty("id", out var idElement))
                paymentId = idElement.GetString();

            if (string.IsNullOrWhiteSpace(paymentId))
                return "NO_PAYMENT_ID";

            // Consultar el pago con la SDK.
            var client = new PaymentClient();
            MercadoPago.Resource.Payment.Payment mpPayment = await client.GetAsync(long.Parse(paymentId));

            if (mpPayment == null)
                return "PAYMENT_NOT_FOUND";

            if (mpPayment.Status != "approved" && mpPayment.Status != "aprobado")
            {
                return "IGNORED";
            }

            // ExternalReference: "cuota:{cuotaId}"
            var externalRef = mpPayment.ExternalReference;
            if (string.IsNullOrWhiteSpace(externalRef))
                return "NO_EXTERNAL_REFERENCE";

            var parts = externalRef.Split(':', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2 || !int.TryParse(parts[1], out var cuotaId))
                return "BAD_EXTERNAL_REFERENCE";

            return await RegistrarPagoAsync(cuotaId);
        }
        catch
        {
            return "INVALID_PAYLOAD";
        }
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

    public async Task<List<UserCuotaDto>> GetUserCuotasAsync(int userId)
    {
        // 1) Asegura que exista la cuota del período vigente para poder pagarla con su ID real.
        await EnsureCurrentPeriodCuotaAsync(userId);

        // 2) Carga todas las cuotas del usuario ordenadas por período.
        var payments = await _context.Payments
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Period)
            .ToListAsync();

        CheckAndUpdateOverdueStatus(payments);
        await _context.SaveChangesAsync();

        return payments
            .Select(p => new UserCuotaDto
            {
                Id = p.Id,
                Period = p.Period,
                Amount = p.Amount,
                LateFeeApplied = p.LateFeeApplied,
                Status = p.Status.ToString().ToUpperInvariant(),
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                CreatedAt = p.CreatedAt
            })
            .ToList();
    }

    /// <summary>
    /// Crea la cuota del período actual (yyyy-MM) si el usuario aún no la tiene,
    /// salvo que esté exento. Así el frontend siempre dispone de un ID de BD real.
    /// </summary>
    private async Task EnsureCurrentPeriodCuotaAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var period = $"{now:yyyy-MM}";

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.IsExemptFromFees) return;

        var exists = await _context.Payments
            .AnyAsync(p => p.UserId == userId && p.Period == period);
        if (exists) return;

        var settings = await GetFeeSettingsAsync();
        var baseFee = settings.BaseFeeAmount > 0 ? settings.BaseFeeAmount : 150000m;

        _context.Payments.Add(new Payment
        {
            UserId = userId,
            Period = period,
            Amount = baseFee,
            LateFeeApplied = 0m,
            PaymentMethod = string.Empty,
            Status = PaymentStatus.Pending,
            PaymentDate = null,
            CreatedAt = now
        });

        await _context.SaveChangesAsync();
    }

    public async Task<string> CreateOrderAsync(int cuotaId)
    {
        // NOTA: En este sistema actual, el "cuotaId" corresponde al Id de Payment.
        var payment = await _context.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == cuotaId);

        if (payment == null) return "NOT_FOUND";
        if (payment.Status == PaymentStatus.Paid) return "ALREADY_PAID";

        // GetOrCreateClubConfigAsync garantiza un token no vacío (config → fallback sandbox).
        var clubConfig = await GetOrCreateClubConfigAsync();

        // MercadoPago SDK (no usado en este paso; el proyecto ya tenía integración parcial)

        // Monto principal (sin comisiones). En este proyecto, "Amount" ya representa lo adeudado.
        var amount = payment.Amount + payment.LateFeeApplied;
        if (amount <= 0) throw new InvalidOperationException("El monto de la cuota debe ser mayor a 0.");

        var rawFee = amount * (clubConfig.ApplicationFeePercentage / 100m);
        var applicationFee = Math.Min(rawFee, clubConfig.MaxApplicationFeeAmount);
        applicationFee = Math.Round(applicationFee, 2, MidpointRounding.AwayFromZero);
        if (applicationFee < 0) applicationFee = 0;

        // Back URL / webhook
        return await CreateMercadoPagoOrderAsync(cuotaId, amount, applicationFee, payment.User, clubConfig.MercadoPagoAccessToken ?? string.Empty);
    }

    /// <summary>
    /// Devuelve la configuración global del club. Si no existe ningún registro en la
    /// base de datos, crea uno por defecto con valores estándar. Si el registro ya
    /// existe pero no tiene token de Mercado Pago, lo completa automáticamente con la
    /// configuración (MercadoPago:AccessToken) o una clave sandbox por defecto.
    /// </summary>
    private async Task<ClubConfig> GetOrCreateClubConfigAsync()
    {
        var configToken = ClubConfigDefaults.ResolveAccessToken(_configuration["MercadoPago:AccessToken"]);
        var configPublicKey = ClubConfigDefaults.ResolvePublicKey(_configuration["MercadoPago:PublicKey"]);

        var clubConfig = await _context.ClubConfigs.FirstOrDefaultAsync();

        if (clubConfig == null)
        {
            clubConfig = new ClubConfig
            {
                TrialEndsAt = DateTime.UtcNow.AddDays(ClubConfigDefaults.DefaultTrialDays),
                MonthlySubscriptionFee = ClubConfigDefaults.DefaultMonthlySubscriptionFee,
                ApplicationFeePercentage = ClubConfigDefaults.DefaultApplicationFeePercentage,
                MaxApplicationFeeAmount = ClubConfigDefaults.DefaultMaxApplicationFeeAmount,
                MercadoPagoAccessToken = configToken,
                MercadoPagoPublicKey = configPublicKey
            };

            _context.ClubConfigs.Add(clubConfig);
            await _context.SaveChangesAsync();
            return clubConfig;
        }

        // Auto-reparación en runtime: si el registro ya existe pero su token está
        // vacío, lo actualizamos con la configuración (o fallback sandbox).
        var changed = false;

        if (string.IsNullOrWhiteSpace(clubConfig.MercadoPagoAccessToken))
        {
            clubConfig.MercadoPagoAccessToken = configToken;
            changed = true;
        }

        if (string.IsNullOrWhiteSpace(clubConfig.MercadoPagoPublicKey))
        {
            clubConfig.MercadoPagoPublicKey = configPublicKey;
            changed = true;
        }

        if (clubConfig.MaxApplicationFeeAmount <= 0)
        {
            clubConfig.MaxApplicationFeeAmount = ClubConfigDefaults.DefaultMaxApplicationFeeAmount;
            changed = true;
        }

        if (changed)
        {
            await _context.SaveChangesAsync();
        }

        return clubConfig;
    }

    private async Task<string> CreateMercadoPagoOrderAsync(
        int cuotaId,
        decimal amount,
        decimal applicationFee,
        User user,
        string accessToken)
    {
        // 1) URL base del frontend a donde Mercado Pago redirige al finalizar el pago.
        //    Se lee de la configuración; si no viene, es vacía o es una ruta relativa,
        //    se fuerza el fallback local absoluto para evitar el error 400
        //    "auto_return invalid. back_url.success must be defined".
        var configuredBaseUrl = _configuration["FrontendUrl"];
        var validBaseUrl = string.IsNullOrWhiteSpace(configuredBaseUrl)
            ? "http://localhost:5173"
            : configuredBaseUrl.Trim().TrimEnd('/');

        if (!validBaseUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !validBaseUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            validBaseUrl = "http://localhost:5173";
        }

        // 2) Configura el Access Token (recibido desde la BD) y valida que no esté vacío antes de llamar a la API.
        accessToken = accessToken.Trim();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new InvalidOperationException(
                "El Access Token de Mercado Pago no está configurado en la base de datos (ClubConfigs.MercadoPagoAccessToken).");
        }

        MercadoPagoConfig.AccessToken = accessToken;

        // 3) Email del pagador con fallback seguro para Sandbox.
        var payerEmail = GetValidPayerEmail(user?.Email);

        // 4) Construcción de la preferencia. UnitPrice redondeado a 2 decimales
        //    (Mercado Pago rechaza importes con más de 2 cifras decimales) y
        //    Quantity es un entero fijo >= 1.
        var request = new PreferenceRequest
        {
            Items = new List<PreferenceItemRequest>
            {
                new PreferenceItemRequest
                {
                    Title = "Cuota Club",
                    Quantity = 1,
                    UnitPrice = Math.Round(amount, 2, MidpointRounding.AwayFromZero),
                    CurrencyId = "ARS"
                }
            },
            ExternalReference = $"cuota:{cuotaId}",
            MarketplaceFee = applicationFee,
            Payer = new PreferencePayerRequest
            {
                Email = payerEmail
            },
            BackUrls = new PreferenceBackUrlsRequest
            {
                Success = $"{validBaseUrl}/mis-cuotas?status=success",
                Failure = $"{validBaseUrl}/mis-cuotas?status=failure",
                Pending = $"{validBaseUrl}/mis-cuotas?status=pending"
            }
            // AutoReturn omitido intencionalmente: su serialización en el SDK de Mercado Pago
            // provocaba el error 400 "auto_return invalid. back_url.success must be defined".
        };

        try
        {
            var client = new PreferenceClient();
            Preference preference = await client.CreateAsync(request);
            return preference.InitPoint;
        }
        catch (MercadoPagoApiException)
        {
            throw;
        }

        /*var request = new OrderRequest
        {
            ExternalReference = $"cuota:{cuotaId}",
            Checkout = new CheckoutRequest
            {
                Type = "redirect",
                RedirectUrl = backUrl
            }
        };

        // Taxes/fees: MercadoPago Orders usa itemization; application_fee se define en request.
        // Si el SDK/versión no expone application_fee como propiedad, se envía vía AdditionalProperties.
        request.AdditionalProperties = new Dictionary<string, object?>
        {
            { "application_fee", (double)applicationFee }
        };

        // Item
        request.Items = new List<OrderItemRequest>
        {
            new OrderItemRequest
            {
                Id = $"cuota-{cuotaId}",
                Title = "Cuota vencida",
                Quantity = 1,
                UnitPrice = (double)amount
            }
        };

        var response = await new OrderClient().CreateAsync(request);
        if (response == null) throw new InvalidOperationException("No se recibió respuesta de Mercado Pago.");

        // Retornamos init_point
        return response.InitPoint ?? response.Id ?? string.Empty;
        */
    }

    /// <summary>
    /// Devuelve un email de pagador válido. Si el email del usuario es nulo, vacío o no
    /// tiene un formato de email válido, se usa un fallback de test de Sandbox para que
    /// Mercado Pago no rechace la preferencia.
    /// </summary>
    private static string GetValidPayerEmail(string? email)
    {
        const string fallbackEmail = "test_user_123456@testuser.com";

        if (string.IsNullOrWhiteSpace(email))
            return fallbackEmail;

        var candidate = email.Trim();

        // Validación básica de formato: usuario@dominio.tld
        var isValid = System.Text.RegularExpressions.Regex.IsMatch(
            candidate,
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return isValid ? candidate : fallbackEmail;
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
