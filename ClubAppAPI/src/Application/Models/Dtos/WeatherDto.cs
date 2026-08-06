namespace ClubApp.Application.Dtos;

public class WeatherDto
{
    public double Temperature { get; set; }
    public double WindSpeed { get; set; }
    public string Condition { get; set; } = string.Empty;
}