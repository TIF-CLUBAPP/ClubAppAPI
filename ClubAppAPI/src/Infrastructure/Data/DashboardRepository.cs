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
}
