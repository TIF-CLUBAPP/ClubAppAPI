namespace ClubApp.Application.Dtos;

public class NotificationDto
{
    public int Id { get; set; }
    public int User_id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
}