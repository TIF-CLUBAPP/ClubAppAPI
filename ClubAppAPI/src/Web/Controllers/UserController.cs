using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Application.Models.Request;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ClubApp.Models.DTOs;
using ClubApp.Application.DTOs;
using ClubApp.Domain.Entities;

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

    /// <summary>
    /// Lista de usuarios (socios y alumnos) con búsqueda y filtros opcionales.
    /// Solo accesible para administradores.
    /// </summary>
    /// <param name="searchQuery">Texto libre para buscar por Nombre, Apellido, DNI, Teléfono o Email.</param>
    /// <param name="role">Filtro por rol: MEMBER, TEACHER, ADMIN o SUPERADMIN.</param>
    /// <param name="status">Filtro por estado: active o blocked.</param>
    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? searchQuery = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null)
    {
        UserRole? roleFilter = null;
        if (!string.IsNullOrWhiteSpace(role))
        {
            if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var parsedRole))
            {
                return BadRequest(new { message = $"Rol inválido: '{role}'. Valores válidos: MEMBER, TEACHER, ADMIN, SUPERADMIN." });
            }
            roleFilter = parsedRole;
        }

        bool? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            statusFilter = status.Trim().ToLowerInvariant() switch
            {
                "active" or "activo" => true,
                "blocked" or "bloqueado" => false,
                _ => (bool?)null
            };

            if (!statusFilter.HasValue)
            {
                return BadRequest(new { message = $"Estado inválido: '{status}'. Valores válidos: active, blocked." });
            }
        }

        var users = await _userService.GetAllUsersAsync(searchQuery, roleFilter, statusFilter);
        return Ok(users);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
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

    /// <summary>
    /// Elimina un usuario (soft delete). Solo administradores.
    /// No permite eliminar la propia cuenta ni que un ADMIN elimine a un SUPERADMIN.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var (actorId, actorRole) = GetActorIdentity();

        if (actorId == id)
        {
            return BadRequest(new { message = "No podés eliminar tu propia cuenta." });
        }

        var target = await _userService.GetUserByIdAsync(id);
        if (target == null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        // Un ADMIN no puede eliminar a un SUPERADMIN
        if (target.Role == UserRole.SUPERADMIN && actorRole != UserRole.SUPERADMIN)
        {
            return Forbid();
        }

        var result = await _userService.DeleteUserAsync(id);
        return result ? Ok(new { message = "Usuario eliminado correctamente" }) : NotFound(new { message = "Usuario no encontrado." });
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

    /// <summary>
    /// Cambia el rol de un usuario (Miembro/Alumno, Profesor, Admin, Super Admin).
    /// Solo administradores. No permite modificar la propia cuenta ni que un ADMIN
    /// modifique a un SUPERADMIN.
    /// </summary>
    [HttpPatch("{id}/role")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> UpdateRole([FromRoute] int id, [FromBody] UpdateRoleDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Debés indicar el nuevo rol." });
        }

        if (!Enum.IsDefined(typeof(UserRole), dto.NewRole))
        {
            return BadRequest(new { message = $"Rol inválido: '{dto.NewRole}'. Valores válidos: 0=MEMBER, 1=TEACHER, 2=ADMIN, 3=SUPERADMIN." });
        }

        var (actorId, actorRole) = GetActorIdentity();

        if (actorId == id)
        {
            return BadRequest(new { message = "No podés modificar el rol de tu propia cuenta." });
        }

        var target = await _userService.GetUserByIdAsync(id);
        if (target == null)
        {
            return NotFound(new { message = "Usuario no encontrado" });
        }

        // Un ADMIN no puede modificar el rol de un SUPERADMIN
        if (target.Role == UserRole.SUPERADMIN && actorRole != UserRole.SUPERADMIN)
        {
            return Forbid();
        }

        // Evita que un SUPERADMIN le quite el rol a otro SUPERADMIN y deje la app sin dueño
        if (actorRole == UserRole.SUPERADMIN && target.Role == UserRole.SUPERADMIN && dto.NewRole != (int)UserRole.SUPERADMIN)
        {
            return BadRequest(new { message = "No podés quitarle el rol de SUPERADMIN a otro administrador." });
        }

        var result = await _userService.UpdateUserRoleAsync(id, dto);
        if (!result) return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Rol actualizado correctamente" });
    }

    /// <summary>
    /// Bloquea o desbloquea la cuenta de un usuario. Solo administradores.
    /// No permite bloquear la propia cuenta ni que un ADMIN bloquee a un SUPERADMIN.
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus([FromRoute] int id, [FromBody] UpdateUserStatusDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Debés indicar el estado (isActive)." });
        }

        var (actorId, actorRole) = GetActorIdentity();

        if (actorId == id)
        {
            return BadRequest(new { message = "No podés bloquear/desbloquear tu propia cuenta." });
        }

        var target = await _userService.GetUserByIdAsync(id);
        if (target == null)
        {
            return NotFound(new { message = "Usuario no encontrado" });
        }

        // Un ADMIN no puede bloquear a un SUPERADMIN
        if (target.Role == UserRole.SUPERADMIN && actorRole != UserRole.SUPERADMIN)
        {
            return Forbid();
        }

        var result = await _userService.SetUserStatusAsync(id, dto.IsActive);
        if (!result) return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new
        {
            message = dto.IsActive
                ? "Usuario desbloqueado correctamente"
                : "Usuario bloqueado correctamente"
        });
    }

    /// <summary>
    /// Obtiene el Id y el Rol del usuario autenticado desde los claims del JWT.
    /// </summary>
    private (int? Id, UserRole? Role) GetActorIdentity()
    {
        var idRaw = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        int? actorId = int.TryParse(idRaw, out var id) ? id : null;

        var roleRaw = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                      ?? User.FindFirst("role")?.Value;

        UserRole? actorRole = Enum.TryParse<UserRole>(roleRaw, ignoreCase: true, out var role)
            ? role
            : null;

        return (actorId, actorRole);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] AuthenticationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _authService.AuthenticationAsync(request);

        if (string.IsNullOrEmpty(result.Token) || result.User == null)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(new { token = result.Token, user = MapUser(result.User) });
    }

    private static object MapUser(User user)
    {
        return new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            fullName = user.FullName,
            email = user.Email,
            role = user.Role.ToString(),
            dni = user.Dni,
            phone = user.Phone,
            birthDate = user.BirthDate
        };
    }
}