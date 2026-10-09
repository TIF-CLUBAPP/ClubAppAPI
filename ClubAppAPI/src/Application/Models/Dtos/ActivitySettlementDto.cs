namespace ClubApp.Application.Dtos;

public class ActivitySettlementDto
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public int TotalEnrollments { get; set; }
    public int MemberEnrollments { get; set; }
    public int NonMemberEnrollments { get; set; }
    public decimal MemberFee { get; set; }
    public decimal NonMemberFee { get; set; }
    public decimal TotalSettlement { get; set; }
}