namespace ClubApp.Application.Dtos;

public class CreateMembershipDto
{
    public int UserId { get; set; }
    public decimal MonthlyPrice { get; set; }
}

/// <summary>
/// Solicitud de suscripción digital al club. El usuario autenticado elige una
/// categoría de socio y el sistema lo convierte en Socio (IsMember = true),
/// creando su membresía y habilitando la generación de su cuota social.
/// </summary>
public class SubscribeMembershipDto
{
    /// <summary>Categoría elegida (ej. "SOCIO_ACTIVO", "SOCIO_ADHERENTE", "SOCIO_FAMILIAR").</summary>
    public string MembershipType { get; set; } = string.Empty;

    /// <summary>Canon mensual de la categoría elegida.</summary>
    public decimal MonthlyPrice { get; set; }
}

public class UpdateStatusDto
{
    public int Status { get; set; } // Recibe el entero del Enum (0 = ACTIVE, 1 = PENDING, 2 = EXPIRED)
}
