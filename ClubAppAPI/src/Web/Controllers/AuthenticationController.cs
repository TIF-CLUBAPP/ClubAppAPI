using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; 
using ClubApp.Application.Interfaces;
using ClubApp.Application.Models.Request;

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

        string? token = await _customAuthenticationService.AuthenticationAsync(authenticationRequest);

        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(new { token = token });
    }
}