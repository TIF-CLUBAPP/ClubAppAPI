using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IPaymentService
{
    // ========== Pagos básicos ==========
    Task<IEnumerable<Payment>> GetAllPaymentsAsync();
    Task<Payment?> GetByIdAsync(int id);
    Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId);
    Task<Payment> CreatePaymentAsync(int loggedInUserId, string userRole, CreatePaymentDto dto); 
    Task<string> UpdateStatusAsync(int paymentId, PaymentStatus status);

    // ========== Configuración de cuotas (FeeSettings) ==========
    Task<FeeSettingsDto> GetFeeSettingsAsync();
    Task<FeeSettingsDto> UpdateFeeSettingsAsync(UpdateFeeSettingsDto dto);

    // ========== Exenciones ==========
    Task<ExemptionsResponseDto> GetExemptionsAsync();
    Task<UserExemptionDto?> ToggleUserExemptionAsync(int userId, bool isExempt);
    Task<RoleExemptionDto?> ToggleRoleExemptionAsync(string roleName, bool areFeesExempt);

    // ========== Listado de pagos con filtros ==========
    Task<PagedPaymentsResponseDto> GetPaymentsAsync(PaymentFilterDto filter);

    // ========== Registro manual de pago ==========
    Task<PaymentDto?> RegisterPaymentAsync(RegisterPaymentDto dto);

    // ========== Cuotas vencidas / Gestión de deudores ==========
    Task<CuotasVencidasStatsDto> GetOverdueCuotasStatsAsync();
    Task<List<CuotaVencidaDto>> GetOverdueCuotasListAsync();
    Task<string> RegistrarPagoAsync(int cuotaId);
}