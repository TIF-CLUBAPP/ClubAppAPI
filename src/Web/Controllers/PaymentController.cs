using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _paymentService.GetAllPaymentsAsync());

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        return Ok(await _paymentService.GetPaymentsByUserAsync(userId));
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PaymentDto dto)
    {
        var result = await _paymentService.RegisterPaymentAsync(dto);
        return result ? Ok(new { message = "Pago registrado" }) : BadRequest();
    }
}