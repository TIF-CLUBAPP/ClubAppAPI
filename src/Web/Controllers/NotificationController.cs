using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        return Ok(await _notificationService.GetNotificationsByUserAsync(userId));
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] NotificationDto dto)
    {
        await _notificationService.SendNotificationAsync(dto);
        return Ok(new { message = "Notificación enviada" });
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _notificationService.MarkAsReadAsync(id);
        return result ? Ok() : NotFound();
    }
}