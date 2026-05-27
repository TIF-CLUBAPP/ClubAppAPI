using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Requests; 
using Microsoft.AspNetCore.Authorization; 

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
    public async Task<IActionResult> Create([FromBody] UserDto userDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        await _userService.CreateUserAsync(userDto);
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