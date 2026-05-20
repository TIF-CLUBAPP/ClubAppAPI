using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Requests
{
    public class AuthenticationRequest
    {
        [Required]
        public string? UserName { get; set; }
        [Required]
        public string? Password { get; set; }
        
        // public string? UserType { get; set; }
    }
}