using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Requests;
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

    // =======================================================================
    // REGISTRO DE USUARIOS: LIBRE DE CANDADOS
    // =======================================================================
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] UserRegisterDto registerDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _userService.CreateUserAsync(registerDto);

        return Ok(new { message = "Usuario creado correctamente" });
    }

    [HttpPost("{id}/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto passwordDto)
    {
        // Extraer ID del token
        var userIdFromToken = User.FindFirst("sub")?.Value
                              ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // Seguridad: Solo el dueño puede
        if (userIdFromToken != id.ToString())
        {
            return Forbid();
        }

        // Llamar al servicio
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
        // 1. Extraer el rol del token de quien está intentando borrar
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                              ?? User.FindFirst("role")?.Value;

        // 2. Control de acceso:
        if (!string.Equals(currentUserRole, "SUPERADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        // 3. Si el token es de un admin groso, procedemos con el borrado
        var result = await _userService.DeleteUserAsync(id);
        return result ? Ok(new { message = "Usuario eliminado" }) : NotFound();
    }

    [HttpPatch("{id}/basic-info")]
    [Authorize]
    public async Task<IActionResult> UpdateBasicInfo(
        [FromRoute] int id,
        [FromBody] UpdateUserBasicRequest request)
    {
        // 1. Extraer el ID y el ROL del token
        var userIdFromToken = User.FindFirst("sub")?.Value
                              ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // Asumiendo que el rol se guarda en el claim 'role'
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? User.FindFirst("role")?.Value;

        // 2. Validación de seguridad: 
        // Permitir si es el dueño (ID coincide) O si es 'SuperAdmin'
        bool isOwner = userIdFromToken == id.ToString();
        bool isSuperAdmin = userRole == "SuperAdmin";

        if (!isOwner && !isSuperAdmin)
        {
            return Forbid(); // Retorna 403 Forbidden si no tiene permisos
        }

        // 3. Ejecutar la lógica de negocio
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

        // Validación estricta con el texto de tu Token ("SUPERADMIN")
        if (!string.Equals(currentUserRole, "SUPERADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _userService.UpdateUserRoleAsync(id, dto);
        if (!result) return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Rol actualizado correctamente" });
    }

    // =======================================================================
    // LOGIN: ASÍNCRONO Y CONFIGURADO CORRECTAMENTE
    // =======================================================================
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] AuthenticationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Usamos el método asincrónico que respeta tu arquitectura limpia con await
        var token = await _authService.AuthenticationAsync(request);

        if (token == null)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(new { token = token });
    }
}