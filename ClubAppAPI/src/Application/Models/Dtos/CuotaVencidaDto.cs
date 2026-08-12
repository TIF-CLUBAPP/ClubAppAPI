namespace ClubApp.Application.Dtos;

/// <summary>
/// Estadísticas de cuotas vencidas (GET /api/cuotas/vencidas/stats).
/// </summary>
public class CuotasVencidasStatsDto
{
    /// <summary>Cantidad total de cuotas impagas (PaymentStatus.OVERDUE o PENDING vencidas).</summary>
    public int TotalCuotasVencidas { get; set; }

    /// <summary>Suma del dinero adeudado por esas cuotas (incluye recargo por mora).</summary>
    public decimal MontoTotalDeuda { get; set; }
}

/// <summary>
/// Detalle de la deuda de un socio (GET /api/cuotas/vencidas).
/// Agrupa todas sus cuotas impagas en una sola fila del panel de deudores.
/// </summary>
public class CuotaVencidaDto
{
    public int SocioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;

    /// <summary>Cantidad de cuotas impagas del socio.</summary>
    public int CantidadCuotasImpagas { get; set; }

    /// <summary>Períodos vencidos en formato legible, ej: ["Junio 2026", "Julio 2026"].</summary>
    public List<string> PeriodosVencidos { get; set; } = new();

    /// <summary>Monto total adeudado (incluye recargo por mora).</summary>
    public decimal MontoTotalAdeudado { get; set; }

    /// <summary>Días de atraso desde la última cuota impaga (DueDate más reciente).</summary>
    public int DiasDeAtraso { get; set; }

    /// <summary>IDs de las cuotas (Payments) impagas para registrar el cobro.</summary>
    public List<int> PaymentIds { get; set; } = new();
}
