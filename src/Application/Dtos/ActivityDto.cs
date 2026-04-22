namespace ClubApp.Application.Dtos;

public class ActivityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Schedule { get; set; } = string.Empty;
    public int AvailableSlots { get; set; }
}