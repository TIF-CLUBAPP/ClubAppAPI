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
            .Include(p => p.Membership)
            .ToListAsync();

        CheckAndUpdateOverdueStatus(payments);
        await _context.SaveChangesAsync();

        return payments;
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        var payment = await _context.Payments
            .Include(p => p.Membership)
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
            .Include(p => p.Membership)
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
            throw new NotFoundException($"No se encontró la membresía con ID {dto.MembershipId}.");

        if (loggedInUserRole != "ADMIN" && loggedInUserRole != "SUPERADMIN" && membership.UserId != loggedInUserId)
        {
            throw new NotAllowedException("No tienes permisos para pagar esta membresía.");
        }

        var method = (PaymentMethod)dto.PaymentMethod;

        var payment = new Payment
        {
            UserId = membership.UserId,
            MembershipId = dto.MembershipId, 
            Amount = membership.MonthlyPrice, 
            DueDate = DateTime.UtcNow.AddDays(10), // Vencimiento a 10 dias por defecto
            PaymentDate = DateTime.UtcNow,
            Method = method,
            Status = method == PaymentMethod.CASH && (loggedInUserRole == "ADMIN" || loggedInUserRole == "SUPERADMIN") 
                        ? PaymentStatus.COMPLETED 
                        : PaymentStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        };

        if (payment.Status == PaymentStatus.COMPLETED)
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
            .Include(p => p.Membership)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null) return "NOT_FOUND";

        // Si se va a completar el pago y esta vencido, se liquida con el 10% de mora
        if (newStatus == PaymentStatus.COMPLETED)
        {
            if (DateTime.UtcNow > payment.DueDate)
            {
                payment.LateFee = payment.Amount * 0.10m; // Recargo del 10%
            }
            payment.Membership.Status = MembershipStatus.ACTIVE;
        }

        payment.Status = newStatus;
        await _context.SaveChangesAsync();
        return "OK";
    }

    // Metodo auxiliar para detectar mora y aplicar 10% de recargo
    private static void CheckAndUpdateOverdueStatus(IEnumerable<Payment> payments)
    {
        foreach (var payment in payments)
        {
            if (payment.Status == PaymentStatus.PENDING && DateTime.UtcNow > payment.DueDate)
            {
                payment.Status = PaymentStatus.OVERDUE;
                payment.LateFee = payment.Amount * 0.10m; // Recargo automatico del 10%
            }
        }
    }

    // ==============================================================
    // Cuotas vencidas / Gestión de deudores
    // ==============================================================

    public async Task<CuotasVencidasStatsDto> GetOverdueCuotasStatsAsync()
    {
        var now = DateTime.UtcNow;

        var overdue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.OVERDUE || (p.Status == PaymentStatus.PENDING && p.DueDate < now))
            .Select(p => new { p.Amount, p.LateFee })
            .ToListAsync();

        return new CuotasVencidasStatsDto
        {
            TotalCuotasVencidas = overdue.Count,
            MontoTotalDeuda = overdue.Sum(p => p.Amount + p.LateFee)
        };
    }

    public async Task<List<CuotaVencidaDto>> GetOverdueCuotasListAsync()
    {
        var now = DateTime.UtcNow;

        var overduePayments = await _context.Payments
            .Include(p => p.User)
            .Where(p => p.Status == PaymentStatus.OVERDUE || (p.Status == PaymentStatus.PENDING && p.DueDate < now))
            .OrderBy(p => p.User.LastName)
            .ThenBy(p => p.User.FirstName)
            .ThenBy(p => p.DueDate)
            .ToListAsync();

        return overduePayments
            .GroupBy(p => p.UserId)
            .Select(g =>
            {
                var user = g.First().User;
                var maxDueDate = g.Max(p => p.DueDate);
                var totalAdeudado = g.Sum(p => p.Amount + p.LateFee);

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
                        .OrderBy(p => p.DueDate)
                        .Select(p => FormatPeriodo(p.DueDate))
                        .ToList(),
                    MontoTotalAdeudado = totalAdeudado,
                    DiasDeAtraso = Math.Max(0, (int)(now.Date - maxDueDate.Date).TotalDays),
                    PaymentIds = g.Select(p => p.Id).OrderBy(id => id).ToList()
                };
            })
            .OrderByDescending(d => d.MontoTotalAdeudado)
            .ToList();
    }

    public async Task<string> RegistrarPagoAsync(int cuotaId)
    {
        var payment = await _context.Payments
            .Include(p => p.Membership)
            .FirstOrDefaultAsync(p => p.Id == cuotaId);

        if (payment == null) return "NOT_FOUND";
        if (payment.Status == PaymentStatus.COMPLETED) return "ALREADY_PAID";

        var now = DateTime.UtcNow;

        // Si la cuota está vencida y aún no tiene recargo, se liquida con el 10% de mora
        if (now > payment.DueDate && payment.LateFee == 0m)
        {
            payment.LateFee = payment.Amount * 0.10m;
        }

        payment.Status = PaymentStatus.COMPLETED;
        payment.PaymentDate = now;

        if (payment.Membership != null)
        {
            payment.Membership.Status = MembershipStatus.ACTIVE;
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
    private static string FormatPeriodo(DateTime dueDate)
    {
        var culture = CultureInfo.GetCultureInfo("es-AR");
        var monthName = culture.DateTimeFormat.GetMonthName(dueDate.Month);
        var capitalized = char.ToUpperInvariant(monthName[0]) + monthName.Substring(1);
        return $"{capitalized} {dueDate.Year}";
    }
}