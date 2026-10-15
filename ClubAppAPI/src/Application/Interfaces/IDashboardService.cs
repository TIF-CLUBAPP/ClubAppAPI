using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();

    /// <summary>Estado en tiempo real de los espacios físicos del club (widget "Sectores").</summary>
    Task<List<SectorStatusDto>> GetSectorsAsync();
}
