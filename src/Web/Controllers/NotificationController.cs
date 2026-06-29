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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int loggedInUserId)) return Unauthorized();

        return Ok(await _notificationService.GetMyNotificationsAsync(loggedInUserId));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Post([FromBody] CreateNotificationDto dto)
    {
        await _notificationService.CreateNotificationAsync(dto);
        return Ok(new { message = "Notificación emitida con éxito." });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null) return NotFound();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole != "ADMIN" && userRole != "SUPERADMIN" && notification.User_id.ToString() != userIdClaim)
        {
            return StatusCode(403, "Acceso denegado.");
        }

        return Ok(notification);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Put(int id, [FromBody] UpdateNotificationDto dto)
    {
        var result = await _notificationService.UpdateNotificationAsync(id, dto);
        if (result == "NOT_FOUND") return NotFound("La notificación no existe.");
        return Ok(new { message = "Notificación corregida." });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _notificationService.DeleteNotificationAsync(id);
        if (!deleted) return NotFound("No se encontró el registro para eliminar.");
        return Ok(new { message = "Notificación eliminada del sistema." });
    }

    [HttpGet("user/{userId:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        return Ok(await _notificationService.GetNotificationsByUserIdAsync(userId));
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int loggedInUserId)) return Unauthorized();

        var result = await _notificationService.MarkAsReadAsync(id, loggedInUserId);
        if (result == "NOT_FOUND") return NotFound();
        if (result == "NOT_AUTHORIZED") return StatusCode(403, "No te pertenece esta alerta.");

        return Ok(new { message = "Marcada como leída." });
    }
}