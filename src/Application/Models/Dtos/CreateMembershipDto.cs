namespace ClubApp.Application.Dtos;

public class CreateMembershipDto
{
    public int UserId { get; set; }
    public decimal MonthlyPrice { get; set; }
}

public class UpdateStatusDto
{
    public int Status { get; set; } // Recibe el entero del Enum (0 = ACTIVE, 1 = PENDING, 2 = EXPIRED)
}
