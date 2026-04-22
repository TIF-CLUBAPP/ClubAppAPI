namespace ClubApp.Domain.Entities;

public class Notification : BaseEntity
{
    // Id y DateTime (CreatedNotif) vienen de BaseEntity
    public int User_id { get; set; } // FK hacia el Usuario
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
}