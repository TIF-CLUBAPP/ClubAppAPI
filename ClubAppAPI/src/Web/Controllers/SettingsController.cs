using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

/// <summary>
/// Configuración general de la Institución (cuentas de cobro / split payments).
/// </summary>
[ApiController]
[Route("api/settings")]
[Authorize(Roles = "ADMIN,SUPERADMIN")]
public class SettingsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public SettingsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>Configuración de cobro de la Institución (cuenta MP + alias).</summary>
    [HttpGet("payout-config")]
    public async Task<IActionResult> GetPayoutConfig()
    {
        return Ok(await _paymentService.GetPayoutConfigAsync());
    }

    /// <summary>Guarda/víncula credenciales de Mercado Pago y alias de cobro del Club.</summary>
    [HttpPost("payout-config")]
    public async Task<IActionResult> SavePayoutConfig([FromBody] SavePayoutConfigRequest dto)
    {
        if (dto == null)
            return BadRequest(new { message = "request inválido" });

        return Ok(await _paymentService.SavePayoutConfigAsync(dto));
    }
}
