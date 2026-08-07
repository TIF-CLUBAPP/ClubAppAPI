namespace ClubApp.Application.Dtos;

public class PaymentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int MembershipId { get; set; } 
    public decimal Amount { get; set; }
    public string Method { get; set; } = "CASH";
    public string Status { get; set; } = "PENDING";
    public DateTime PaymentDate { get; set; }
    public string? ExternalTransactionId { get; set; }
}