namespace ClubApp.Domain.Constants;

/// <summary>
/// Valores por defecto para la configuración global del club (<see cref="ClubApp.Domain.Entities.ClubConfig"/>).
/// Se usan tanto en el seeder (<c>DbInitializer</c>) como en <c>PaymentService</c> para garantizar
/// que siempre exista una configuración válida con un token de Mercado Pago no vacío.
/// </summary>
public static class ClubConfigDefaults
{
    public const int DefaultTrialDays = 30;
    public const decimal DefaultMonthlySubscriptionFee = 15000m;
    public const decimal DefaultApplicationFeePercentage = 3.5m;
    public const decimal DefaultMaxApplicationFeeAmount = 1500m;

    /// <summary>
    /// Clave de acceso de prueba (sandbox) usada como último recurso cuando no hay
    /// token configurado. Reemplazar por una credencial real en producción.
    /// </summary>
    public const string DefaultMercadoPagoAccessToken =
        "APP_USR-5133245797874624-092207-169d6ab111d587c8ad10ae1fcbb60b08-3708779206";

    /// <summary>
    /// Public key de prueba (sandbox) usada como último recurso.
    /// </summary>
    public const string DefaultMercadoPagoPublicKey =
        "APP_USR-fda22464-758a-4fcd-9f56-a7d3087fa424";

    /// <summary>
    /// Devuelve el AccessToken configurado o, si viene nulo/vacío, la clave sandbox por defecto.
    /// </summary>
    public static string ResolveAccessToken(string? configured) =>
        string.IsNullOrWhiteSpace(configured) ? DefaultMercadoPagoAccessToken : configured!.Trim();

    /// <summary>
    /// Devuelve la PublicKey configurada o, si viene nula/vacía, la clave sandbox por defecto.
    /// </summary>
    public static string ResolvePublicKey(string? configured) =>
        string.IsNullOrWhiteSpace(configured) ? DefaultMercadoPagoPublicKey : configured!.Trim();
}
