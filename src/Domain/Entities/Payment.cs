namespace ClubApp.Domain.Entities;

public enum PaymentMethod { MERCADOPAGO, CASH }
public enum PaymentStatus { COMPLETED, PENDING, FAILED }

public class Payment : BaseEntity
{
    public int User_id { get; set; }    
    public int Member_id { get; set; }  
    public int Member_Id { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    public string ExternalTransactionId { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; } = DateTime.Now;



    public virtual User User { get; set; } = null!;
    public virtual Membership Membership { get; set; } = null!;
}