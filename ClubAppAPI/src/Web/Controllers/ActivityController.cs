using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using ClubApp.Application.Dtos;
using System.Security.Claims;
using ClubApp.Domain.Entities;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    // =======================================================================
    // ACCIONES DISPONIBLES PARA CUALQUIER USUARIO LOGUEADO
    // =======================================================================

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _activityService.GetAllAvailableActivitiesAsync());

    [HttpGet("{activityId:int}")]
    public async Task<IActionResult> GetById([FromRoute] int activityId)
    {
        var activity = await _activityService.GetActivityByIdAsync(activityId);
        if (activity == null) return NotFound(new { message = "Actividad no encontrada" });
        return Ok(activity);
    }

    // =======================================================================
    // GESTIÓN DEL CATÁLOGO (Admin y Profesores para sus clases)
    // =======================================================================

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN,TEACHER")]
    public async Task<IActionResult> Post([FromBody] SaveActivityRequest dto)
    {
        var (actorId, actorRole) = GetActorIdentity();
        var createdActivity = await _activityService.CreateActivityAsync(dto, actorId, actorRole);

        return CreatedAtAction(
            nameof(GetById),
            new { activityId = createdActivity.Id },
            createdActivity
        );
    }

    [HttpPut("{activityId:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN,TEACHER")]
    public async Task<IActionResult> Put(int activityId, [FromBody] SaveActivityRequest dto)
    {
        var (actorId, actorRole) = GetActorIdentity();
        var result = await _activityService.UpdateActivityAsync(activityId, dto, actorId, actorRole);

        if (!result) return NotFound(new { message = $"No se encontró la actividad con ID {activityId}" });

        return Ok(new { message = "Actividad modificada con éxito" });
    }

    /// <summary>Permite que el usuario autenticado (Profesor/Admin) se auto-asigne a una actividad.</summary>
    [HttpPost("{activityId:int}/assign-me")]
    [Authorize(Roles = "TEACHER,ADMIN,SUPERADMIN")]
    public async Task<IActionResult> AssignMe(int activityId)
    {
        var (actorId, _) = GetActorIdentity();
        var updated = await _activityService.AssignInstructorAsync(activityId, actorId);

        if (updated == null) return NotFound(new { message = $"No se encontró la actividad con ID {activityId}" });

        return Ok(updated);
    }

    [HttpDelete("{activityId:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN,TEACHER")]
    public async Task<IActionResult> Delete(int activityId)
    {
        var (actorId, actorRole) = GetActorIdentity();
        var result = await _activityService.DeleteActivityAsync(activityId, actorId, actorRole);

        if (!result) return NotFound(new { message = $"No se pudo eliminar: ID {activityId} no encontrado" });

        return Ok(new { message = $"Actividad {activityId} eliminada" });
    }

    [HttpGet("{activityId:int}/settlement")]
    [Authorize(Roles = "ADMIN,SUPERADMIN,TEACHER")]
    public async Task<IActionResult> GetSettlement(int activityId)
    {
        var (actorId, actorRole) = GetActorIdentity();
        
        // Si es profesor, verificar que sea el encargado de la actividad antes de mostrar liquidación
        if (actorRole == UserRole.TEACHER)
        {
            var activity = await _activityService.GetActivityByIdAsync(activityId);
            if (activity == null) return NotFound();
            if (activity.TeacherId != actorId && activity.Instructors.All(i => i.Id != actorId))
            {
                return Forbid();
            }
        }

        var settlement = await _activityService.GetActivitySettlementAsync(activityId);
        return Ok(settlement);
    }


    private (int Id, UserRole Role) GetActorIdentity()
    {
        var idRaw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;
        int id = int.TryParse(idRaw, out var parsed) ? parsed : 0;

        var roleRaw = User.FindFirst(ClaimTypes.Role)?.Value
                      ?? User.FindFirst("role")?.Value;
        UserRole role = Enum.TryParse<UserRole>(roleRaw, ignoreCase: true, out var r) ? r : UserRole.MEMBER;

        return (id, role);
    }
}