using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ClubApp.API.Controllers;

/// <summary>
/// Reserva grupal / pago dividido. La inicialización y el pago requieren sesión;
/// el estado público del grupo se consulta libremente con el token único.
/// </summary>
[ApiController]
[Route("api/bookings/group")]
[Authorize]
public class GroupBookingsController : ControllerBase
{
    private readonly IGroupBookingService _groupBookingService;

    public GroupBookingsController(IGroupBookingService groupBookingService)
    {
        _groupBookingService = groupBookingService;
    }

    /// <summary>Inicia una reserva grupal y registra la cuota del organizador.</summary>
    [HttpPost("init")]
    public async Task<IActionResult> Init([FromBody] InitGroupBookingRequest dto)
    {
        if (dto == null) return BadRequest(new { message = "request inválido" });

        var result = await _groupBookingService.InitAsync(GetUserId(), dto);
        return Ok(result);
    }

    /// <summary>Obtiene el estado público del grupo mediante su token único.</summary>
    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "token inválido" });

        return Ok(await _groupBookingService.GetByTokenAsync(token));
    }

    /// <summary>Registra el pago de un participante individual.</summary>
    [HttpPost("{token}/pay")]
    public async Task<IActionResult> Pay(string token, [FromBody] GroupPayRequest dto)
    {
        if (dto == null) return BadRequest(new { message = "request inválido" });

        return Ok(await _groupBookingService.PayAsync(token, GetUserId(), dto));
    }

    private int GetUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (int.TryParse(raw, out var id)) return id;
        throw new UnauthorizedAccessException("Token inválido.");
    }
}
