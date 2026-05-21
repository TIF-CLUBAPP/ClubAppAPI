using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization; 

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
    // ACCIÓN DISPONIBLE PARA CUALQUIER SOCIO LOGUEADO
    // =======================================================================
    
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _activityService.GetAllAvailableActivitiesAsync());

    // =======================================================================
    // ACCIONES EXCLUSIVAS PARA ADMINISTRADORES
    // =======================================================================

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Post([FromBody] ActivityDto dto)
    {
        await _activityService.CreateActivityAsync(dto);
        return Ok("Actividad creada con éxito"); 
    }

    [HttpPut("{activityId:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Put(int activityId, [FromBody] ActivityDto dto)
    {
        var result = await _activityService.UpdateActivityAsync(activityId, dto);

        if (!result) return NotFound($"No se encontró la actividad con ID {activityId}");

        return Ok("Actividad modificada con éxito");
    }

    [HttpDelete("{activityId:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Delete(int activityId)
    {
        var result = await _activityService.DeleteActivityAsync(activityId);

        if (!result) return NotFound($"No se pudo eliminar: ID {activityId} no encontrado");

        return Ok($"Actividad {activityId} eliminada");
    }
}