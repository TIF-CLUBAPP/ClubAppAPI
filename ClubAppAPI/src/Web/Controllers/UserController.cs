using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Models.Request;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ClubApp.Models.DTOs;
using ClubApp.Application.DTOs;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICustomAuthenticationService _authService;

    public UsersController(IUserService userService, ICustomAuthenticationService authService)
    {
        _userService = userService;
        _authService = authService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _userService.GetAllUsersAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return user != null ? Ok(user) : NotFound();
    }

    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] UserRegisterDto registerDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // El servicio crea el usuario y devuelve el objeto/DTO creado con su ID
        var createdUser = await _userService.CreateUserAsync(registerDto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdUser.Id },
            createdUser
        );
    }

    [HttpPost("{id}/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto passwordDto)
    {
        var userIdFromToken = User.FindFirst("sub")?.Value
                              ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userIdFromToken != id.ToString())
        {
            return Forbid();
        }

        var result = await _userService.ChangePasswordAsync(id, passwordDto);

        if (!result)
        {
            return BadRequest(new { message = "Error: Verifica tu contraseña actual o el formato de la nueva." });
        }

        return Ok(new { message = "Contraseña actualizada correctamente" });
    }

    [HttpDelete("{id:int}")]
    [Authorize] 
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                              ?? User.FindFirst("role")?.Value;

        if (!string.Equals(currentUserRole, "SUPERADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _userService.DeleteUserAsync(id);
        return result ? Ok(new { message = "Usuario eliminado" }) : NotFound();
    }

    [HttpPatch("{id}/basic-info")]
    [Authorize]
    public async Task<IActionResult> UpdateBasicInfo(
        [FromRoute] int id,
        [FromBody] UpdateUserBasicRequest request)
    {
        var userIdFromToken = User.FindFirst("sub")?.Value
                              ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? User.FindFirst("role")?.Value;

        bool isOwner = userIdFromToken == id.ToString();
        bool isSuperAdmin = string.Equals(userRole, "SUPERADMIN", StringComparison.OrdinalIgnoreCase) 
                            || string.Equals(userRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

        if (!isOwner && !isSuperAdmin)
        {
            return Forbid();
        }

        var result = await _userService.UpdateBasicInfoAsync(id, request);

        if (!result)
        {
            return NotFound(new { message = "Usuario no encontrado" });
        }

        return Ok(new { message = "Actualizado" });
    }

    [HttpPatch("{id}/role")]
    [Authorize]
    public async Task<IActionResult> UpdateRole([FromRoute] int id, [FromBody] UpdateRoleDto dto)
    {
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                              ?? User.FindFirst("role")?.Value;

        if (!string.Equals(currentUserRole, "SUPERADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _userService.UpdateUserRoleAsync(id, dto);
        if (!result) return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Rol actualizado correctamente" });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] AuthenticationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var token = await _authService.AuthenticationAsync(request);

        if (token == null)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(new { token = token });
    }
}