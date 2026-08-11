using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Dtos;

public class ForgotPasswordDto
{
    [Required(ErrorMessage = "El correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de correo electrónico inválido.")]
    public string Email { get; set; } = string.Empty;
}
