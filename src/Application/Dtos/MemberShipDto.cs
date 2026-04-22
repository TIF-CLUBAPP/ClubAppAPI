namespace ClubApp.Application.Dtos;

public class MembershipDto
{
    public int Id { get; set; }
    public int User_id { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal MonthlyPrice { get; set; }
}