using ClubApp.Domain.Entities;

namespace ClubApp.Application.Dtos;

public class UserDto
{
    public int Id { get; set; }
    public string BadgeNum { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Password { get; set; } = string.Empty;
}