using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Interfaces;

namespace ClubApp.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;

    public DashboardService(IDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public Task<DashboardStatsDto> GetStatsAsync() => _dashboardRepository.GetStatsAsync();
}
