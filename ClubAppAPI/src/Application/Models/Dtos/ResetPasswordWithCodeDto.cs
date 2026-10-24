using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Dtos;

public class ResetPasswordWithCodeDto
{
    [Required(ErrorMessage = "El correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de correo electrónico inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El código de verificación es requerido.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "El código de verificación debe tener 6 dígitos.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida.")]
    [MinLength(4, ErrorMessage = "La contraseña debe tener al menos 4 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;
}
