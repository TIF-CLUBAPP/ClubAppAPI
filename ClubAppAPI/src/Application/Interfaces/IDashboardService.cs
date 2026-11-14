using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();

    /// <summary>Estado en tiempo real de los espacios físicos del club (widget "Sectores").</summary>
    Task<List<SectorStatusDto>> GetSectorsAsync();

    /// <summary>Datos del panel "Control de Socios".</summary>
    Task<ControlSociosDto> GetControlSociosAsync(string rango);

    /// <summary>Datos del panel "Control de Recaudación".</summary>
    Task<ControlRecaudacionDto> GetControlRecaudacionAsync(string rango);
}
