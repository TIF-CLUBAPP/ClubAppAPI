namespace ClubApp.Application.Dtos;

/// <summary>
/// Configuración de cobro de la Institución (GET/POST /api/settings/payout-config).
/// El AccessToken de Mercado Pago nunca se expone: solo se informa si ya está vinculado.
/// </summary>
public class PayoutConfigDto
{
    public bool HasMercadoPagoAccessToken { get; set; }
    public string? MercadoPagoUserId { get; set; }
    public string? BankAlias { get; set; }
    public decimal ApplicationFeePercentage { get; set; }
    public decimal MaxApplicationFeeAmount { get; set; }
}

/// <summary>
/// Entrada para guardar/vincular las credenciales y el alias de cobro del Club.
/// </summary>
public class SavePayoutConfigRequest
{
    public string? MercadoPagoAccessToken { get; set; }
    public string? MercadoPagoUserId { get; set; }
    public string? BankAlias { get; set; }
}

/// <summary>
/// Configuración de cobro directo de un profesor (GET/PATCH /api/teachers/{id}/payout-settings).
/// </summary>
public class TeacherPayoutSettingsDto
{
    public int TeacherId { get; set; }
    public bool AllowsDirectPayment { get; set; }
    public string? BankAlias { get; set; }
    public bool HasMercadoPagoAccessToken { get; set; }
    public string? MercadoPagoUserId { get; set; }
}

/// <summary>
/// Entrada para permitir/denegar el cobro directo de un profesor y guardar sus datos de cobro.
/// </summary>
public class TeacherPayoutSettingsRequest
{
    public bool AllowsDirectPayment { get; set; }
    public string? BankAlias { get; set; }
    public string? MercadoPagoAccessToken { get; set; }
    public string? MercadoPagoUserId { get; set; }
}
