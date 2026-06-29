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

    // 1. GET /api/Payments (Historial global de caja - Solo jefes)
    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _paymentService.GetAllPaymentsAsync());
    }

    // 2. POST /api/Payments (Iniciar una orden de pago)
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreatePaymentDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            return Unauthorized("Token inválido.");

        var result = await _paymentService.CreatePaymentAsync(loggedInUserId, userRoleClaim ?? "", dto);

        return result switch
        {
            "OK" => Ok(new { message = "Registro de pago procesado." }),
            "NOT_AUTHORIZED" => StatusCode(403, new { message = "No tienes permisos para pagar esta membresía." }),
            "MEMBERSHIP_NOT_FOUND" => NotFound(new { message = "La membresía no existe." }),
            _ => BadRequest()
        };
    }

    // 3. GET /api/Payments/user/{userId} (Historial propio o visto por un Admin)
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        // Si no es admin y quiere ver los pagos de otro ID, patitas a la calle
        if (userRoleClaim != "ADMIN" && userRoleClaim != "SUPERADMIN" && userId.ToString() != userIdClaim)
        {
            return StatusCode(403, "No tienes permiso para ver el historial contable de otro usuario.");
        }

        return Ok(await _paymentService.GetPaymentsByUserIdAsync(userId));
    }

    // 4. PATCH /api/Payments/{paymentId}/status (Aprobar/Rechazar pagos - Exclusivo Admin)
    [HttpPatch("{paymentId:int}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> UpdateStatus(int paymentId, [FromBody] UpdatePaymentStatusDto dto)
    {
        if (!Enum.IsDefined(typeof(PaymentStatus), dto.Status))
            return BadRequest("Estado de pago inválido.");

        var result = await _paymentService.UpdateStatusAsync(paymentId, (PaymentStatus)dto.Status);

        if (result == "NOT_FOUND") return NotFound("El registro de pago no existe.");
        return Ok(new { message = "Estado de pago actualizado en caja." });
    }
}