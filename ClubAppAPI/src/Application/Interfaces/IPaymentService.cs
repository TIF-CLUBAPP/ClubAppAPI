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

    /// <summary>
    /// Actualiza la tarifa. NO sobrescribe deudas pasadas: archiva la tarifa anterior
    /// en el historial y deja la nueva pendiente hasta el 1° del mes siguiente.
    /// </summary>
    Task<FeeSettingsDto> UpdateFeeSettingsAsync(UpdateFeeSettingsDto dto, int? changedByUserId = null);

    /// <summary>Historial de cambios de precios, más reciente primero.</summary>
    Task<List<FeeSettingsHistoryDto>> GetFeeSettingsHistoryAsync();

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

    /// <summary>Registra el pago de una única cuota (cobro total).</summary>
    Task<string> RegistrarPagoAsync(int cuotaId);

    /// <summary>
    /// Cobro parcial: registra únicamente las cuotas indicadas y deja el resto impagas.
    /// </summary>
    Task<RegistrarPagoParcialResult> RegistrarPagoParcialAsync(IEnumerable<int> cuotaIds);
}

/// <summary>
/// Resultado del cobro parcial de cuotas.
/// </summary>
public class RegistrarPagoParcialResult
{
    public int CuotasPagadas { get; set; }
    public int CuotasOmitidas { get; set; }
    public decimal MontoTotal { get; set; }
}