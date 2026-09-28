using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ClubApp.API.Controllers;

/// <summary>
/// Reserva de espacios (canchas) con pago asociado.
/// </summary>
[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>
    /// Disponibilidad por fecha (?date=yyyy-MM-dd) o reservas del usuario autenticado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? date)
    {
        if (date.HasValue)
            return Ok(await _bookingService.GetBookingsByDateAsync(date.Value.Date));

        return Ok(await _bookingService.GetMyBookingsAsync(GetUserId()));
    }

    /// <summary>Reservas del usuario autenticado.</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        return Ok(await _bookingService.GetMyBookingsAsync(GetUserId()));
    }

    /// <summary>Crea una reserva vinculada a un pago (regla de comisión ATRIO).</summary>
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateBookingRequest dto)
    {
        if (dto == null) return BadRequest(new { message = "request inválido" });

        var booking = await _bookingService.CreateBookingAsync(GetUserId(), dto);
        return Ok(booking);
    }

    /// <summary>Confirma una reserva tras el pago aprobado.</summary>
    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        await _bookingService.ConfirmBookingAsync(id, GetUserId());
        return Ok(new { message = "Reserva confirmada." });
    }

    /// <summary>Cancela una reserva.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        await _bookingService.CancelBookingAsync(id, GetUserId());
        return Ok(new { message = "Reserva cancelada." });
    }

    private int GetUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (int.TryParse(raw, out var id)) return id;
        throw new UnauthorizedAccessException("Token inválido.");
    }
}