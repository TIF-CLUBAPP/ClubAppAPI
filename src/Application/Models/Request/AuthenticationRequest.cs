using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Models.Request
{
    public class AuthenticationRequest
    {
        [Required]
        public string? Email { get; set; }
        [Required]
        public string? Password { get; set; }
        
        // public string? UserType { get; set; }
    }
}