namespace ClubApp.Application.Dtos;

public class CreatePaymentDto
{
    public int MembershipId { get; set; } 
    public int PaymentMethod { get; set; } // 0 = MERCADOPAGO, 1 = CASH
}

public class UpdatePaymentStatusDto
{
    public int Status { get; set; } // 0 = COMPLETED, 1 = PENDING, 2 = FAILED
}