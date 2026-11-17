namespace ClubApp.Domain.Entities;

/// <summary>
/// Regla de recargo por mora aplicable a una actividad una vez superado su día de vencimiento.
/// </summary>
public enum TipoRecargoMora
{
    /// <summary>Sin recargo por atraso.</summary>
    Ninguno,

    /// <summary>Recargo porcentual sobre el precio base (%).</summary>
    Porcentaje,

    /// <summary>Recargo de monto fijo en pesos ($).</summary>
    MontoFijo
}
