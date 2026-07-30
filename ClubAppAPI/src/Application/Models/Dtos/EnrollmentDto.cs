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
}
