using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
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
        return await _context.Payments
            .Include(p => p.Membership)
            .ToListAsync();
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        return await _context.Payments
            .Include(p => p.Membership)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId)
    {
        return await _context.Payments
            .Include(p => p.Membership)
            .Where(p => p.Membership.User_id == userId) 
            .ToListAsync();
    }

    public async Task<Payment> CreatePaymentAsync(int loggedInUserId, string loggedInUserRole, CreatePaymentDto dto)
    {
        var membership = await _context.Memberships.FindAsync(dto.MembershipId);
        if (membership == null)
            throw new KeyNotFoundException($"No se encontró la membresía con ID {dto.MembershipId}.");

        if (loggedInUserRole != "ADMIN" && loggedInUserRole != "SUPERADMIN" && membership.User_id != loggedInUserId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para pagar esta membresía.");
        }

        var method = (PaymentMethod)dto.PaymentMethod;

        var payment = new Payment
        {
            Member_id = dto.MembershipId,
            Amount = membership.MonthlyPrice, 
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

        payment.Status = newStatus;

        if (newStatus == PaymentStatus.COMPLETED)
        {
            payment.Membership.Status = MembershipStatus.ACTIVE;
        }

        await _context.SaveChangesAsync();
        return "OK";
    }
}