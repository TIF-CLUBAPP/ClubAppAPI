using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _paymentService.GetAllPaymentsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await _paymentService.GetByIdAsync(id);
        if (payment == null)
            return NotFound(new { message = $"No se encontró el registro de pago {id}." });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRoleClaim != "ADMIN" && userRoleClaim != "SUPERADMIN" && payment.UserId.ToString() != userIdClaim)
        {
            return StatusCode(403, new { message = "No tienes permiso para ver este registro de pago." });
        }

        return Ok(payment);
    }
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRoleClaim != "ADMIN" && userRoleClaim != "SUPERADMIN" && userId.ToString() != userIdClaim)
        {
            return StatusCode(403, new { message = "No tienes permiso para ver el historial contable de otro usuario." });
        }

        return Ok(await _paymentService.GetPaymentsByUserIdAsync(userId));
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Post([FromBody] CreatePaymentDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            return Unauthorized("Token inválido.");

        var createdPayment = await _paymentService.CreatePaymentAsync(loggedInUserId, userRoleClaim ?? "", dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdPayment.Id },
            createdPayment
        );
    }

    [HttpPatch("{paymentId:int}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> UpdateStatus(int paymentId, [FromBody] UpdatePaymentStatusDto dto)
    {
        if (!Enum.IsDefined(typeof(PaymentStatus), dto.Status))
            return BadRequest(new { message = "Estado de pago inválido." });

        var result = await _paymentService.UpdateStatusAsync(paymentId, (PaymentStatus)dto.Status);

        if (result == "NOT_FOUND")
            return NotFound(new { message = "El registro de pago no existe." });

        return Ok(new { message = "Estado de pago actualizado en caja." });
    }
}