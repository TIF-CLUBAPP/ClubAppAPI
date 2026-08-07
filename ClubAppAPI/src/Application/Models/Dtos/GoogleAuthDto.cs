using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Dtos;

public class GoogleAuthDto
{
    [Required(ErrorMessage = "El IdToken de Google es obligatorio.")]
    public string IdToken { get; set; } = string.Empty;
}
