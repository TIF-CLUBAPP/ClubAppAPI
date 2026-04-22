namespace ClubApp.Application.Dtos;

public class PaymentDto
{
    public int Id { get; set; }
    public int User_id { get; set; }
    public int Member_id { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "CASH";
    public string Status { get; set; } = "PENDING";
    public DateTime PaymentDate { get; set; }
    public string? ExternalTransactionId { get; set; }
}