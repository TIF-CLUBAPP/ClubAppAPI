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

    // ========== Mercado Pago - Órdenes ==========
    /// <summary>
    /// Crea una orden en Mercado Pago a partir de una o varias cuotas (deuda adeudada).
    /// Retorna el init_point para que el frontend redirija al checkout seguro.
    /// </summary>
    Task<string> CreateOrderAsync(IEnumerable<int> cuotaIds);

    /// <summary>
    /// Procesa el pago con tarjeta tokenizada (Branded) usando el token devuelto por
    /// Mercado Pago en el cliente. Si el pago es aprobado, registra las cuotas como pagadas.
    /// </summary>
    Task<CardPaymentResult> ProcessCardPaymentAsync(IEnumerable<int> cuotaIds, string token);

    /// <summary>
    /// Devuelve las cuotas del usuario autenticado con su ID numérico primario real.
    /// Asegura que exista la cuota del período vigente en la base de datos (la crea si falta)
    /// para que el flujo de pago siempre tenga un ID relacional válido.
    /// </summary>
    Task<List<UserCuotaDto>> GetUserCuotasAsync(int userId);

    /// <summary>
    /// Procesa el webhook de Mercado Pago. Si el pago está aprobado, registra el pago en el sistema.
    /// </summary>
    Task<string> ProcessMercadoPagoWebhookAsync(string payloadJson);


    // ========== Configuración de cobros (payout) ==========
    /// <summary>Configuración de cobro de la Institución (cuenta MP + alias).</summary>
    Task<PayoutConfigDto> GetPayoutConfigAsync();

    /// <summary>Guarda/víncula las credenciales y el alias de cobro del Club.</summary>
    Task<PayoutConfigDto> SavePayoutConfigAsync(SavePayoutConfigRequest dto);

    // ========== Mercado Pago - OAuth (vinculación de cuenta) ==========
    /// <summary>Construye la URL de autorización OAuth para vincular la cuenta MP del usuario.</summary>
    Task<string?> BuildMercadoPagoConnectUrlAsync(int userId, string redirectUri);

    /// <summary>Intercambia el código OAuth por credenciales y las guarda en el usuario.</summary>
    Task<MercadoPagoConnectResult> ConnectMercadoPagoAsync(string code, string state, string redirectUri);

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

    // ========== Transferencia bancaria ==========
    /// <summary>
    /// Registra una transferencia bancaria como pendiente de aprobación del club,
    /// con la comisión ATRIO (MarketplaceFee) para auditoría/facturación.
    /// </summary>
    Task<TransferPaymentResult> RegisterTransferAsync(RegisterTransferRequest dto);

    /// <summary>Lista las transferencias pendientes de aprobación para el panel admin.</summary>
    Task<List<PaymentDto>> GetPendingTransfersAsync();

    // ========== Cuotas vencidas / Gestión de deudores ==========
    Task<CuotasVencidasStatsDto> GetOverdueCuotasStatsAsync();
    Task<List<CuotaVencidaDto>> GetOverdueCuotasListAsync();

    /// <summary>Registra el pago de una única cuota (cobro total).</summary>
    /// <param name="paymentMethod">Método a registrar (ej. "MERCADOPAGO"). Null = no modificar.</param>
    Task<string> RegistrarPagoAsync(int cuotaId, string? paymentMethod = null);

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