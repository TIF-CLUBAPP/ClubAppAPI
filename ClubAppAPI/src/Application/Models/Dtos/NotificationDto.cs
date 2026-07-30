namespace ClubApp.Application.Dtos;

public class CreateNotificationDto
{
    public int? User_id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class UpdateNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}