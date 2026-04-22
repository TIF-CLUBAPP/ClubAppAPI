namespace ClubApp.Domain.Entities;

public enum PaymentMethod { MERCADOPAGO, CASH }
public enum PaymentStatus { COMPLETED, PENDING, FAILED }

public class Payment : BaseEntity
{
    // Id viene de BaseEntity (sería el Payment_id del diagrama)
    public int User_id { get; set; }    // FK hacia Usuario
    public int Member_id { get; set; }  // FK hacia Membership
    
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.CASH;
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    
    public string ExternalTransactionId { get; set; } = string.Empty;
}