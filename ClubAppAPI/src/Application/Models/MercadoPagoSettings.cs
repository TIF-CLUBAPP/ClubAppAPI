namespace ClubApp.Application.Models;

/// <summary>
/// Configuración fuertemente tipada para la integración con Mercado Pago.
/// Se vincula a la sección "MercadoPago" de appsettings.json mediante el patrón
/// Options de .NET y se consume con IOptions de MercadoPagoSettings.
/// </summary>
public class MercadoPagoSettings
{
    /// <summary>Clave pública de Mercado Pago (se expone al frontend para el SDK de pago).</summary>
    public string PublicKey { get; set; } = string.Empty;

    /// <summary>Token de acceso privado que el backend usa para crear preferencias/órdenes.</summary>
    public string AccessToken { get; set; } = string.Empty;
}
