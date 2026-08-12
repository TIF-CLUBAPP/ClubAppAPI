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