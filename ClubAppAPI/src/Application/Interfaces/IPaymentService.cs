using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllPaymentsAsync();
    Task<Payment?> GetByIdAsync(int id);
    Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId);
    Task<Payment> CreatePaymentAsync(int loggedInUserId, string userRole, CreatePaymentDto dto); 
    Task<string> UpdateStatusAsync(int paymentId, PaymentStatus status);

    // ========== Cuotas vencidas / Gestión de deudores ==========

    /// <summary>Cantidad total de cuotas impagas y monto total adeudado.</summary>
    Task<CuotasVencidasStatsDto> GetOverdueCuotasStatsAsync();

    /// <summary>Lista detallada de socios con cuotas impagas agrupadas por socio.</summary>
    Task<List<CuotaVencidaDto>> GetOverdueCuotasListAsync();

    /// <summary>
    /// Marca una cuota como pagada (cobro en caja).
    /// Devuelve "OK", "NOT_FOUND" o "ALREADY_PAID".
    /// </summary>
    Task<string> RegistrarPagoAsync(int cuotaId);
}