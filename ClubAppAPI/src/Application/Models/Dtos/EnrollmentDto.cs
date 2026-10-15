namespace ClubApp.Application.Dtos
{
    public class EnrollmentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ActivityId { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; } = "Active";
        public string? ActivityName { get; set; } // opcional si lo querés mostrar
    }

    /// <summary>Inscripción del usuario autenticado con el detalle de su actividad (GET /api/enrollments/my).</summary>
    public class MyEnrollmentDto
    {
        public int Id { get; set; }
        public int ActivityId { get; set; }
        public string ActivityName { get; set; } = string.Empty;
        public string? SpaceName { get; set; }
        public string? InstructorName { get; set; }
        public string Status { get; set; } = "ACTIVE";
        public DateTime EnrollmentDate { get; set; }
        public List<ActivityScheduleDto> Schedules { get; set; } = new();
    }
}
