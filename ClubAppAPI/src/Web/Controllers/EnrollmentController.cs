using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Get()
    {
        return Ok(await _enrollmentService.GetAllEnrollmentsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var enrollment = await _enrollmentService.GetEnrollmentByIdAsync(id);
        if (enrollment == null) return NotFound($"No existe la inscripción {id}");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRoleClaim != "ADMIN" && userRoleClaim != "SUPERADMIN" && enrollment.UserId.ToString() != userIdClaim)
        {
            return StatusCode(403, "No tienes permisos para ver esta inscripción.");
        }

        return Ok(enrollment);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateEnrollmentDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            return Unauthorized("Token inválido.");

        var result = await _enrollmentService.CreateEnrollmentAsync(userId, dto);
        return result == "OK" ? Ok(new { message = "Inscripción exitosa." }) : BadRequest(new { message = result });
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int loggedInUserId))
            return Unauthorized("Token inválido.");

        var result = await _enrollmentService.CancelEnrollmentAsync(id, loggedInUserId, userRoleClaim ?? "");

        return result switch
        {
            "OK" => Ok(new { message = "Inscripción cancelada." }),
            "NOT_AUTHORIZED" => StatusCode(403, new { message = "No puedes cancelar la inscripción de otra persona." }),
            "NOT_FOUND" => NotFound(new { message = "Inscripción no encontrada." }),
            "ALREADY_CANCELED" => BadRequest(new { message = "Ya estaba cancelada." }),
            _ => BadRequest()
        };
    }
}