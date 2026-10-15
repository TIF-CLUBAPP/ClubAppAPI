using System.Threading.Tasks;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IWeatherService
{
    Task<WeatherDto?> GetCurrentWeatherAsync();
}