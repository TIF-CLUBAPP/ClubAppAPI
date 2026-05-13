namespace ClubApp.Domain.Entities
{
    public class Enrollment : BaseEntity
    {
        public int UserId { get; set; }
        public int ActivityId { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;

        // Relaciones
        public virtual User User { get; set; } = null!;
        public virtual Activity Activity { get; set; } = null!;
    }

    public enum EnrollmentStatus { Active, Cancelled }
}
