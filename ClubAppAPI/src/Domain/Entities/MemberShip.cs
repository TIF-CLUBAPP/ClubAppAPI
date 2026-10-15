namespace ClubApp.Domain.Entities;

public enum MembershipStatus { ACTIVE, INACTIVE, SUSPENDED, EXPIRED, EXPIRING }

public class Membership : BaseEntity
{
    public int UserId { get; set; }
    public decimal MonthlyPrice { get; set; }
    public MembershipStatus Status { get; set; } = MembershipStatus.INACTIVE;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddYears(1);
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}