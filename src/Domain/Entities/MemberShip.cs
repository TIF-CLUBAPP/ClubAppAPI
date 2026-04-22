namespace ClubApp.Domain.Entities;

public enum MembershipStatus
{
    ACTIVE,
    EXPIRED,
    PENDING,
    EXPIRING
}

public class Membership : BaseEntity
{
    // Id viene de BaseEntity (sería el Member_id del diagrama)
    public int User_id { get; set; } // FK hacia el Usuario
    public MembershipStatus Status { get; set; } = MembershipStatus.PENDING;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal MonthlyPrice { get; set; }
}