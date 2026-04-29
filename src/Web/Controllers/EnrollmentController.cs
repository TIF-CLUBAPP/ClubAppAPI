using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentsController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    [HttpGet]
    public async Task<IActionResult> Get() 
    {
        return Ok(await _enrollmentService.GetAllEnrollmentsAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] EnrollmentDto dto)
    {
        var result = await _enrollmentService.CreateEnrollmentAsync(dto);
        return result ? Ok("Inscripción creada") : BadRequest("Error al inscribir");
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _enrollmentService.CancelEnrollmentAsync(id);
        return result ? Ok("Inscripción cancelada") : NotFound();
    }

        [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromBody] EnrollmentDto dto)
    {
        var result = await _enrollmentService.UpdateEnrollmentAsync(id, dto);
        if (!result) return NotFound($"No se encontró la inscripción con ID {id}");
        return Ok("Inscripción actualizada con éxito");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _enrollmentService.DeleteEnrollmentAsync(id);
        if (!result) return NotFound($"No se encontró la inscripción con ID {id}");
        return Ok($"Inscripción {id} eliminada");
    }
}