using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await paymentService.GetAllPaymentsAsync());

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var payments = await paymentService.GetPaymentsByUserAsync(userId);
        return Ok(payments);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PaymentDto dto)
    {
        await paymentService.RegisterPaymentAsync(dto);
        return Ok("Pago registrado correctamente");
    }

    [HttpPatch("{paymentId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int paymentId, [FromBody] string newStatus)
    {
        var result = await paymentService.UpdatePaymentStatusAsync(paymentId, newStatus);
        
        if (!result) return NotFound($"No se encontro el pago con ID {paymentId}");

        return Ok($"Estado del pago {paymentId} actualizado a {newStatus}");
    }
}