namespace ClubApp.Domain.Entities;

public class Enrollment : BaseEntity
{
    public int UserId { get; set; }
    public int ActivityId { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
}

public enum EnrollmentStatus { Active, Cancelled }