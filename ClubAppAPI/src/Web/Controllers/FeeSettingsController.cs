using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

/// <summary>
/// Configuración de exenciones de cuota por rol (porcentaje).
/// Los cambios NO son retroactivos: se aplican a partir del 1° del mes siguiente.
/// </summary>
[ApiController]
[Route("api/fee-settings")]
[Authorize(Roles = "ADMIN,SUPERADMIN")]
public class FeeSettingsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public FeeSettingsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>Política vigente (y pendiente) de exención de cuota por rol.</summary>
    [HttpGet("role-exemptions")]
    public async Task<IActionResult> GetRoleExemptions()
    {
        return Ok(await _paymentService.GetRoleFeeExemptionsAsync());
    }

    /// <summary>
    /// Guarda la nueva política de exención por rol. La nueva exención comenzará a
    /// aplicarse a partir de la emisión del mes siguiente (siguiente ciclo de facturación).
    /// </summary>
    [HttpPut("role-exemptions")]
    public async Task<IActionResult> UpdateRoleExemptions([FromBody] UpdateRoleFeeExemptionsRequest request)
    {
        if (request?.Exemptions == null || request.Exemptions.Count == 0)
        {
            return BadRequest(new { message = "Debe indicar al menos una exención de rol." });
        }

        var updated = await _paymentService.UpdateRoleFeeExemptionsAsync(request.Exemptions);
        return Ok(updated);
    }

    /// <summary>Regla vigente (y pendiente) de corte de servicio / suspensión por mora.</summary>
    [HttpGet("suspension-rules")]
    public async Task<IActionResult> GetSuspensionRules()
    {
        return Ok(await _paymentService.GetSuspensionSettingsAsync());
    }

    /// <summary>
    /// Guarda la nueva regla de suspensión por mora. La regla queda pendiente y comienza
    /// a regir a partir del 1° del mes siguiente.
    /// </summary>
    [HttpPut("suspension-rules")]
    public async Task<IActionResult> UpdateSuspensionRules([FromBody] UpdateSuspensionSettingsRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Debe indicar la regla de suspensión." });
        }

        if (request.MaxOverdueMonths < 0)
        {
            return BadRequest(new { message = "Los meses de mora permitidos no pueden ser negativos." });
        }

        if (request.MaxOverdueAmount < 0)
        {
            return BadRequest(new { message = "El monto máximo de deuda no puede ser negativo." });
        }

        var condition = (request.SuspensionCondition ?? string.Empty).Trim().ToUpperInvariant();
        if (condition != "OR" && condition != "AND")
        {
            return BadRequest(new { message = "La condición de suspensión debe ser OR o AND." });
        }

        var updated = await _paymentService.UpdateSuspensionSettingsAsync(request);
        return Ok(updated);
    }
}
