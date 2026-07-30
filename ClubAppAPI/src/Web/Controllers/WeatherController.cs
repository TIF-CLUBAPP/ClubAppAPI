using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WeatherController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public WeatherController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentWeather()
    {
        var weather = await _weatherService.GetCurrentWeatherAsync();
        
        if (weather == null)
        {
            return StatusCode(503, "No se pudo obtener el clima en este momento, intente más tarde.");
        }

        return Ok(weather);
    }
}