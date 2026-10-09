using ClubApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Estadísticas en tiempo real del club: socios activos, nuevos socios del mes,
    /// recaudación del mes y cuotas vencidas.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _dashboardService.GetStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Estado en tiempo real de los espacios físicos del club (widget "Sectores del Club").
    /// Devuelve por cada espacio su estado actual, ocupación y próximo turno.
    /// </summary>
    [HttpGet("sectors")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSectors()
    {
        var sectors = await _dashboardService.GetSectorsAsync();
        return Ok(sectors);
    }
}
