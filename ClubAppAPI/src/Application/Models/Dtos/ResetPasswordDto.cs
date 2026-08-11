using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Dtos;

public class ResetPasswordDto
{
    [Required(ErrorMessage = "El correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de correo electrónico inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El token es requerido.")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida.")]
    [MinLength(4, ErrorMessage = "La contraseña debe tener al menos 4 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;
}
