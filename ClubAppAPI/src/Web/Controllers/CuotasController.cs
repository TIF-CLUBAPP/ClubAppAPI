using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

/// <summary>
/// Endpoints de Tesorería para la gestión de cuotas vencidas y deudores.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CuotasController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public CuotasController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// Cantidad total de cuotas vencidas y suma del dinero adeudado.
    /// </summary>
    [HttpGet("vencidas/stats")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverdueStats()
    {
        return Ok(await _paymentService.GetOverdueCuotasStatsAsync());
    }

    /// <summary>
    /// Lista detallada de socios con deuda: datos de contacto, períodos vencidos,
    /// cantidad de cuotas impagas, monto total adeudado y días de atraso.
    /// </summary>
    [HttpGet("vencidas")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverdueList()
    {
        return Ok(await _paymentService.GetOverdueCuotasListAsync());
    }

    /// <summary>
    /// Marca una cuota vencida (o deuda) como pagada. Registra el cobro en caja,
    /// liquida el 10% de mora si corresponde y reactiva la membresía del socio.
    /// </summary>
    [HttpPost("{id:int}/registrar-pago")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegistrarPago(int id)
    {
        var result = await _paymentService.RegistrarPagoAsync(id);

        return result switch
        {
            "NOT_FOUND" => NotFound(new { message = $"No se encontró la cuota {id}." }),
            "ALREADY_PAID" => BadRequest(new { message = "La cuota ya fue registrada como pagada." }),
            _ => Ok(new { message = "Pago registrado correctamente.", cuotaId = id })
        };
    }
}
