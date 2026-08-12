namespace ClubApp.Application.Dtos;

/// <summary>
/// Exención de usuario (GET /api/payments/exemptions)
/// </summary>
public class UserExemptionDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsExemptFromFees { get; set; }
}

/// <summary>
/// Exención de rol (GET /api/payments/exemptions)
/// </summary>
public class RoleExemptionDto
{
    public string Role { get; set; } = string.Empty;
    public bool AreFeesExempt { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Respuesta completa de exenciones
/// </summary>
public class ExemptionsResponseDto
{
    public List<UserExemptionDto> Users { get; set; } = new();
    public List<RoleExemptionDto> Roles { get; set; } = new();
}

/// <summary>
/// DTO para alternar exención de usuario
/// </summary>
public class ToggleUserExemptionDto
{
    public int UserId { get; set; }
    public bool IsExemptFromFees { get; set; }
}

/// <summary>
/// DTO para alternar exención de rol
/// </summary>
public class ToggleRoleExemptionDto
{
    public string Role { get; set; } = string.Empty;
    public bool AreFeesExempt { get; set; }
}