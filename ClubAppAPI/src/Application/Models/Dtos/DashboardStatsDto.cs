namespace ClubApp.Application.Dtos;

/// <summary>
/// Estadísticas agregadas del club para el Dashboard administrativo.
/// Se calculan en vivo contra la base de datos en cada request.
/// </summary>
public class DashboardStatsDto
{
    /// <summary>Socios con membresía activa (Membership.Status == ACTIVE).</summary>
    public int SociosActivos { get; set; }

    /// <summary>Total de usuarios con rol MEMBER (socios registrados).</summary>
    public int TotalSocios { get; set; }

    /// <summary>Nuevos socios (rol MEMBER) registrados en el mes en curso (altas del mes).</summary>
    public int NuevosEsteMes { get; set; }

    /// <summary>Usuarios NO socios (IsMember = false) con al menos una inscripción ACTIVA a actividades.</summary>
    public int NoSociosEnActividades { get; set; }

    /// <summary>Usuarios que se dieron de baja en el mes (membresía cancelada/vencida cuyo vencimiento cae en el mes).</summary>
    public int BajasEsteMes { get; set; }

    /// <summary>Recaudación del mes por CUOTAS (pagos Paid de membresía).</summary>
    public decimal RecaudacionCuotas { get; set; }

    /// <summary>Recaudación del mes por ACTIVIDADES (inscripciones activas del mes en actividades cobradas por el Club).</summary>
    public decimal RecaudacionActividades { get; set; }

    /// <summary>Total recaudado del mes (cuotas + actividades).</summary>
    public decimal TotalRecaudado { get; set; }

    /// <summary>Recaudación del mes en curso (suma de pagos COMPLETED). Retrocompatible.</summary>
    public decimal MonthlyRevenue { get; set; }

    /// <summary>Porcentaje cobrado del mes (COMPLETED / total emitido del mes).</summary>
    public decimal CollectedPercentage { get; set; }

    /// <summary>Cantidad de cuotas vencidas (PaymentStatus.OVERDUE o PENDING vencidas).</summary>
    public int CuotasVencidas { get; set; }

    /// <summary>Monto total adeudado por cuotas vencidas (incluye recargo por mora).</summary>
    public decimal MontoTotalDeuda { get; set; }
}
