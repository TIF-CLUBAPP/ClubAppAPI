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
    
    /// <summary>Indica si el socio está bloqueado automáticamente por morosidad (> 2 cuotas).</summary>
    public bool EsAutoBloqueado => CantidadCuotasImpagas > 2;

    /// <summary>Indica si el socio fue bloqueado manualmente por un admin.</summary>
    public bool EsBloqueadoManual { get; set; }

    /// <summary>Bloqueado total (auto o manual).</summary>
    public bool EstaBloqueado => EsAutoBloqueado || EsBloqueadoManual;

    /// <summary>Períodos vencidos en formato legible, ej: ["Junio 2026", "Julio 2026"].</summary>
    public List<string> PeriodosVencidos { get; set; } = new();

    /// <summary>
    /// Detalle discriminado de cada cuota impaga, para mostrar en el panel si la deuda
    /// combina cuota social y cuotas de actividades (con su concepto, actividad y vencimiento).
    /// </summary>
    public List<CuotaDeudaDetalleDto> Cuotas { get; set; } = new();

    /// <summary>Monto total adeudado (incluye recargo por mora).</summary>
    public decimal MontoTotalAdeudado { get; set; }

    /// <summary>Días de atraso desde la última cuota impaga (DueDate más reciente).</summary>
    public int DiasDeAtraso { get; set; }

    /// <summary>IDs de las cuotas (Payments) impagas para registrar el cobro.</summary>
    public List<int> PaymentIds { get; set; } = new();
}

/// <summary>
/// Detalle individual de una cuota impaga dentro de la deuda consolidada de un socio.
/// </summary>
public class CuotaDeudaDetalleDto
{
    public int PaymentId { get; set; }

    /// <summary>"CuotaSocial" | "Actividad".</summary>
    public string Concepto { get; set; } = "CuotaSocial";

    public int? ActivityId { get; set; }
    public string? ActivityName { get; set; }

    /// <summary>Período en formato legible (ej. "Septiembre 2026").</summary>
    public string Periodo { get; set; } = string.Empty;

    /// <summary>Monto base.</summary>
    public decimal Amount { get; set; }

    /// <summary>Recargo por mora aplicado.</summary>
    public decimal LateFeeApplied { get; set; }

    /// <summary>Total (base + recargo).</summary>
    public decimal Total => Amount + LateFeeApplied;
}
