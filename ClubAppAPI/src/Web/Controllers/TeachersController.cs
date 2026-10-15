using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

/// <summary>
/// Configuración de cobro directo de los profesores (split payments).
/// </summary>
[ApiController]
[Route("api/teachers")]
[Authorize(Roles = "ADMIN,SUPERADMIN")]
public class TeachersController : ControllerBase
{
    private readonly IUserService _userService;

    public TeachersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>Obtiene la configuración de cobro directo de un profesor.</summary>
    [HttpGet("{id:int}/payout-settings")]
    public async Task<IActionResult> GetPayoutSettings(int id)
    {
        var result = await _userService.GetTeacherPayoutSettingsAsync(id);
        return result == null ? NotFound(new { message = "Profesor no encontrado" }) : Ok(result);
    }

    /// <summary>Permite/deniega el cobro directo y guarda los datos de cobro del profesor.</summary>
    [HttpPatch("{id:int}/payout-settings")]
    public async Task<IActionResult> UpdatePayoutSettings(int id, [FromBody] TeacherPayoutSettingsRequest dto)
    {
        if (dto == null)
            return BadRequest(new { message = "request inválido" });

        var result = await _userService.UpdateTeacherPayoutSettingsAsync(id, dto);
        return result == null ? NotFound(new { message = "Profesor no encontrado" }) : Ok(result);
    }
}
