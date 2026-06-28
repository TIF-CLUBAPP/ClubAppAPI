using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromBody] UserDto dto)
    {
        var result = await _userService.UpdateUserAsync(id, dto);
        if (!result) return NotFound($"No se pudo actualizar: ID {id} no encontrado");

        return Ok("Usuario modificado");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
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