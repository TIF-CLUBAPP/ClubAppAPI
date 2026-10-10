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

/// <summary>
/// Configuración de cobro directo del usuario autenticado (GET/PUT /api/users/profile/payment-info).
/// El AccessToken de Mercado Pago nunca se expone: solo se informa si ya está vinculado.
/// </summary>
public class ProfilePaymentInfoDto
{
    public bool AllowsDirectPayment { get; set; }
    public string? BankAlias { get; set; }
    public bool HasMercadoPagoAccessToken { get; set; }
    public string? MercadoPagoUserId { get; set; }
}

/// <summary>
/// Entrada para que el profesor guarde su Alias/CBU/CVU desde su propio perfil.
/// </summary>
public class SaveProfilePaymentInfoRequest
{
    public string? BankAlias { get; set; }
}

/// <summary>
/// Resultado del callback de vinculación OAuth de Mercado Pago.
/// </summary>
public class MercadoPagoConnectResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
}
