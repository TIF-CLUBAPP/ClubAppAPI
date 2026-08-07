using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;

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
}