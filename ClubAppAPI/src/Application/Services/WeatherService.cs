using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;

namespace ClubApp.Application.Services;

public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;

    public WeatherService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<WeatherDto?> GetCurrentWeatherAsync()
    {
        try
        {
            // Usamos las coordenadas de Rosario
            var url = "https://api.open-meteo.com/v1/forecast?latitude=-32.94&longitude=-60.63&current_weather=true";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);
            
            var currentWeather = doc.RootElement.GetProperty("current_weather");
            
            double temp = currentWeather.GetProperty("temperature").GetDouble();
            double wind = currentWeather.GetProperty("windspeed").GetDouble();
            int weatherCode = currentWeather.GetProperty("weathercode").GetInt32();

            return new WeatherDto
            {
                Temperature = temp,
                WindSpeed = wind,
                Condition = MapWeatherCode(weatherCode)
            };
        }
        catch
        {
            return null;
        }
    }

    private string MapWeatherCode(int code)
    {
        return code switch
        {
            0 => "Despejado",
            1 or 2 or 3 => "Parcialmente Nublado",
            45 or 48 => "Niebla",
            51 or 53 or 55 => "Llovizna",
            61 or 63 or 65 => "Lluvia",
            71 or 73 or 75 => "Nevada",
            80 or 81 or 82 => "Chubascos de lluvia",
            95 or 96 or 99 => "Tormenta eléctrica",
            _ => "Variable"
        };
    }
}