using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] 
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

    // =======================================================================
    // ACCIONES EXCLUSIVAS PARA ADMINISTRADORES
    // =======================================================================

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Send([FromBody] NotificationDto dto)
    {
        var result = await _notificationService.SendNotificationAsync(dto);
        return result ? Ok(new { message = "Notificación enviada" }) : BadRequest("Error al enviar");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Put(int id, [FromBody] NotificationDto dto)
    {
        var result = await _notificationService.UpdateNotificationAsync(id, dto);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok("Notificación actualizada con éxito");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _notificationService.DeleteNotificationAsync(id);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok($"Notificación {id} eliminada");
    }

    // =======================================================================
    // ACCIÓN DISPONIBLE PARA CUALQUIER USUARIO LOGUEADO
    // =======================================================================

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _notificationService.MarkAsReadAsync(id);
        if (!result) return NotFound($"No se encontró la notificación con ID {id}");
        return Ok("Notificación marcada como leída");
    }
}