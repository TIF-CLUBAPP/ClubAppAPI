using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}
