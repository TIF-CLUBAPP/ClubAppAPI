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

    public Task<List<SectorStatusDto>> GetSectorsAsync() => _dashboardRepository.GetSectorsAsync();

    public Task<ControlSociosDto> GetControlSociosAsync(string rango) => _dashboardRepository.GetControlSociosAsync(rango);

    public Task<ControlRecaudacionDto> GetControlRecaudacionAsync(string rango) => _dashboardRepository.GetControlRecaudacionAsync(rango);
}
