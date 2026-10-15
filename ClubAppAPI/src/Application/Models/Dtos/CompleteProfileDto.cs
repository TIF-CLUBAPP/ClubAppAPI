using System.ComponentModel.DataAnnotations;

namespace ClubApp.Application.Dtos;

public class CompleteProfileDto
{
    [Required(ErrorMessage = "El DNI es obligatorio.")]
    [RegularExpression("^\\d{7,8}$", ErrorMessage = "El DNI debe tener 7 u 8 dígitos numéricos.")]
    public string Dni { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [RegularExpression("^\\+?[0-9]{7,15}$", ErrorMessage = "El teléfono no tiene un formato válido.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    [DataType(System.ComponentModel.DataAnnotations.DataType.Date)]
    public DateTime BirthDate { get; set; }

    // Id del usuario que completa el perfil (puede venir del token del frontend)
    [Required]
    public int UserId { get; set; }
}
