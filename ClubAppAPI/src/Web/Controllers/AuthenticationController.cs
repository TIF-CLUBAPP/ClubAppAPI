using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; 
using ClubApp.Application.Interfaces;
using ClubApp.Application.Models.Request;
using ClubApp.Domain.Entities;

namespace ClubApp.Web.Controllers;

[ApiController]
[Route("api/authentication")]
[AllowAnonymous]
public class AuthenticationController : ControllerBase
{
    private readonly ICustomAuthenticationService _customAuthenticationService;

    public AuthenticationController(ICustomAuthenticationService customAuthenticationService)
    {
        _customAuthenticationService = customAuthenticationService;
    }

    [HttpPost("authenticate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Authenticate([FromBody] AuthenticationRequest authenticationRequest)
    {
        if (!ModelState.IsValid) 
            return BadRequest(ModelState);

        string? token = null;
        User? user = null;

        var result = await _customAuthenticationService.AuthenticationAsync(authenticationRequest);
        token = result.Token;
        user = result.User;

        if (string.IsNullOrEmpty(token) || user == null)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(new { token = token, user = MapUser(user) });
    }

    /// <summary>
    /// Valida que el token JWT enviado en el header Authorization sea válido y no haya expirado.
    /// Devuelve los datos del usuario si el token es válido, o 401 si es inválido/expirado.
    /// Se usa en el arranque del frontend para detectar "sesiones fantasma".
    /// </summary>
    [HttpGet("validate-token")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult ValidateToken()
    {
        // Si llegamos aquí, el middleware de autenticación ya validó el token (firma + expiración).
        // Reconstruimos el usuario a partir de los claims del JWT.
        var userIdRaw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;
        var firstName = User.FindFirst(System.Security.Claims.ClaimTypes.GivenName)?.Value
                        ?? User.FindFirst("given_name")?.Value
                        ?? User.FindFirst("unique_name")?.Value
                        ?? User.FindFirst("name")?.Value;
        var lastName = User.FindFirst(System.Security.Claims.ClaimTypes.Surname)?.Value
                       ?? User.FindFirst("family_name")?.Value;
        var roleRaw = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                      ?? User.FindFirst("role")?.Value;
        var dni = User.FindFirst("dni")?.Value;
        var phone = User.FindFirst("phone")?.Value;
        var birthDate = User.FindFirst("birthDate")?.Value;

        int? userId = int.TryParse(userIdRaw, out var parsedId) ? parsedId : (int?)null;

        return Ok(new
        {
            id = userId,
            email,
            firstName,
            lastName,
            role = roleRaw,
            dni,
            phone,
            birthDate
        });
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