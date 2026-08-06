namespace ClubApp.Domain.Entities;

public class Notification : BaseEntity
{
    public int? User_id { get; set; } 
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}