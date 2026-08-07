namespace ClubApp.Domain.Entities;

public enum PaymentMethod { MERCADOPAGO, CASH }
public enum PaymentStatus { COMPLETED, PENDING, FAILED, OVERDUE }

public class Payment : BaseEntity
{
    public int UserId { get; set; }
    public int MembershipId { get; set; }
    
    public decimal Amount { get; set; }               // Monto original
    public decimal LateFee { get; set; } = 0m;        // Recargo por mora (10%)
    public decimal TotalAmount => Amount + LateFee;    // Monto final calculated

    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    public string ExternalTransactionId { get; set; } = string.Empty;
    
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30); // Fecha de vencimiento
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
    public virtual Membership Membership { get; set; } = null!;
}