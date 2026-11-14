namespace ClubApp.Application.Dtos;

/// <summary>Punto de una serie temporal (flujo de socios o ingresos).</summary>
public class PuntoSerieDto
{
    /// <summary>Etiqueta legible del período (ej: "2026-11", "14/11", "11:00").</summary>
    public string Etiqueta { get; set; } = string.Empty;

    /// <summary>Valor del bucket (fecha/clave estable para el gráfico).</summary>
    public string Clave { get; set; } = string.Empty;

    /// <summary>Altas en el período.</summary>
    public int Altas { get; set; }

    /// <summary>Bajas en el período.</summary>
    public int Bajas { get; set; }

    /// <summary>Neta = altas - bajas.</summary>
    public int Neto => Altas - Bajas;
}

/// <summary>Punto temporal de ingresos desglosados por categoría.</summary>
public class IngresoPeriodoDto
{
    public string Etiqueta { get; set; } = string.Empty;
    public string Clave { get; set; } = string.Empty;

    /// <summary>Recaudación por cuotas en el período.</summary>
    public decimal Cuotas { get; set; }

    /// <summary>Recaudación por alquileres (canchas/espacios) en el período.</summary>
    public decimal Alquileres { get; set; }

    /// <summary>Recaudación por actividades en el período.</summary>
    public decimal Actividades { get; set; }

    public decimal Total => Cuotas + Alquileres + Actividades;
}

/// <summary>Estadística individual por persona (socio/no socio).</summary>
public class PersonaMetricaDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool EsSocio { get; set; }

    /// <summary>Cantidad de alquileres de canchas/espacios (reservas confirmadas).</summary>
    public int Alquileres { get; set; }

    /// <summary>Cantidad de actividades en las que participa (inscripciones activas).</summary>
    public int Actividades { get; set; }
}

/// <summary>Respuesta del panel "Control de Socios".</summary>
public class ControlSociosDto
{
    public int SociosActivos { get; set; }
    public int NoSociosEnActividades { get; set; }
    public int AltasMes { get; set; }
    public int BajasMes { get; set; }
    public int NetoMes => AltasMes - BajasMes;

    /// <summary>Serie temporal de altas/bajas/neta filtrada por rango.</summary>
    public List<PuntoSerieDto> SerieTemporal { get; set; } = new();

    /// <summary>Detalle individual por persona (alquileres + actividades).</summary>
    public List<PersonaMetricaDto> Personas { get; set; } = new();
}

/// <summary>Respuesta del panel "Control de Recaudación".</summary>
public class ControlRecaudacionDto
{
    public decimal TotalCuotas { get; set; }
    public decimal TotalAlquileres { get; set; }
    public decimal TotalActividades { get; set; }
    public decimal TotalGeneral => TotalCuotas + TotalAlquileres + TotalActividades;

    /// <summary>Serie temporal de ingresos por categoría filtrada por rango.</summary>
    public List<IngresoPeriodoDto> SerieTemporal { get; set; } = new();
}
