using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization; 

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] 
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentsController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    // =======================================================================
    // VISTA Y GESTIÓN GLOBAL: EXCLUSIVA PARA ADMINISTRADORES
    // =======================================================================

    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Get() 
    {
        return Ok(await _enrollmentService.GetAllEnrollmentsAsync());
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Put(int id, [FromBody] EnrollmentDto dto)
    {
        var result = await _enrollmentService.UpdateEnrollmentAsync(id, dto);
        if (!result) return NotFound($"No se encontró la inscripción con ID {id}");
        return Ok("Inscripción actualizada con éxito");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _enrollmentService.DeleteEnrollmentAsync(id);
        if (!result) return NotFound($"No se encontró la inscripción con ID {id}");
        return Ok($"Inscripción {id} eliminada");
    }

    // =======================================================================
    // ACCIONES DE LOS SOCIOS (CUALQUIER USUARIO LOGUEADO)
    // =======================================================================

    [HttpPost] // Un miembro común puede inscribirse a una actividad
    public async Task<IActionResult> Post([FromBody] EnrollmentDto dto)
    {
        var result = await _enrollmentService.CreateEnrollmentAsync(dto);
        return result ? Ok("Inscripción creada") : BadRequest("Error al inscribir");
    }

    [HttpPatch("{id}/cancel")] 
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _enrollmentService.CancelEnrollmentAsync(id);
        return result ? Ok("Inscripción cancelación exitosa") : NotFound();
    }
}