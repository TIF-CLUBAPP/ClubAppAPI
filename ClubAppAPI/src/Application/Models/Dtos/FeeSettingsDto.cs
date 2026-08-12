namespace ClubApp.Application.Dtos;

/// <summary>
/// Configuración de cuotas (GET/PUT /api/payments/settings)
/// </summary>
public class FeeSettingsDto
{
    public decimal BaseFeeAmount { get; set; }
    public decimal LateFeePercentage { get; set; }
    public int DueDayOfMonth { get; set; }
}

/// <summary>
/// DTO para actualizar configuración de cuotas (PUT /api/payments/settings)
/// </summary>
public class UpdateFeeSettingsDto
{
    public decimal BaseFeeAmount { get; set; }
    public decimal LateFeePercentage { get; set; }
    public int DueDayOfMonth { get; set; }
}