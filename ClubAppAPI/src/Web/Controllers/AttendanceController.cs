using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ClubApp.API.Controllers;

/// <summary>
/// Registro rápido de asistencia para profesores.
/// </summary>
[ApiController]
[Route("api/attendance")]
[Authorize(Roles = "TEACHER,ADMIN,SUPERADMIN")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    /// <summary>Clases del día del profesor con sus alumnos inscriptos.</summary>
    [HttpGet("classes")]
    public async Task<IActionResult> Classes([FromQuery] DateTime? date)
    {
        var d = date?.Date ?? DateTime.UtcNow.Date;
        return Ok(await _attendanceService.GetTeacherClassesAsync(GetUserId(), d));
    }

    /// <summary>Registra la asistencia (presente/ausente) de una clase.</summary>
    [HttpPost("mark")]
    public async Task<IActionResult> Mark([FromBody] MarkAttendanceRequest request)
    {
        if (request == null) return BadRequest(new { message = "request inválido" });

        var ok = await _attendanceService.MarkAttendanceAsync(GetUserId(), request);
        return ok
            ? Ok(new { message = "Asistencia guardada." })
            : BadRequest(new { message = "No se pudo guardar la asistencia." });
    }

    private int GetUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (int.TryParse(raw, out var id)) return id;
        throw new UnauthorizedAccessException("Token inválido.");
    }
}