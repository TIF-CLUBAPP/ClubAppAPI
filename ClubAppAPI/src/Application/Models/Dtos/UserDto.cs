using ClubApp.Domain.Entities;
using System.Text.Json.Serialization;

public class UserDto 
{
    public int Id { get; set; }
    public string BadgeNum { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }

    // Se serializa como string ("MEMBER", "TEACHER", "ADMIN", "SUPERADMIN")
    // para que coincida con el frontend, pero se mantiene como enum en C#.
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}