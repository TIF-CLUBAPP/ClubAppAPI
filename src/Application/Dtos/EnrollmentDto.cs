namespace ClubApp.Application.Dtos;

public class EnrollmentDto
{
    public int Id { get; set; }


    public int UserId { get; set; }
    public int ActivityId { get; set; }

    public DateTime EnrollmentDate { get; set; }

    // Status como string para facilitar la lectura en el JSON de la API
    public string Status { get; set; } = "Active";
    // Podés agregar datos extra que sirvan para la UI
    public string? ActivityName { get; set; } 
}