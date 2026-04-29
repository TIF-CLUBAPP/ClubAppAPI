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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _notificationService.GetAllNotificationsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);
        if (notification == null) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok(notification);
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        return Ok(await _notificationService.GetNotificationsByUserAsync(userId));
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] NotificationDto dto)
    {
        var result = await _notificationService.SendNotificationAsync(dto);
        return result ? Ok(new { message = "Notificación enviada" }) : BadRequest("Error al enviar");
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromBody] NotificationDto dto)
    {
        var result = await _notificationService.UpdateNotificationAsync(id, dto);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok("Notificación actualizada con éxito");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _notificationService.DeleteNotificationAsync(id);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok($"Notificación {id} eliminada");
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _notificationService.MarkAsReadAsync(id);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok("Notificación marcada como leída");
    }
}