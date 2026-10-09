using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

/// <summary>
/// Repositorio de lecturas/agregaciones para el Dashboard administrativo.
/// </summary>
public interface IDashboardRepository
{
    /// <summary>Calcula las estadísticas agregadas del club (socios, recaudación, cuotas).</summary>
    Task<DashboardStatsDto> GetStatsAsync();

    /// <summary>Calcula el estado en tiempo real de los espacios físicos del club.</summary>
    Task<List<SectorStatusDto>> GetSectorsAsync();
}
