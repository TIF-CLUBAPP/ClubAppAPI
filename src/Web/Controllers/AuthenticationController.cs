using ClubApp.Application.Interfaces;
using ClubApp.Application.Requests;
using ClubApp.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; 

namespace ClubApp.Web.Controllers;

[Route("api/authentication")]
[ApiController]
[AllowAnonymous]
public class AuthenticationController : ControllerBase
{
    private readonly ICustomAuthenticationService _customAuthenticationService;

    public AuthenticationController(ICustomAuthenticationService autenticacionService)
    {
        _customAuthenticationService = autenticacionService;
    }

    [HttpPost("authenticate")]
    public async Task<ActionResult<string>> Authenticate([FromBody] AuthenticationRequest authenticationRequest)
    {
        try
        {
            string? token = await _customAuthenticationService.AuthenticationAsync(authenticationRequest);

            if (token == null)
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
            }

            // 2. Devolvemos el objeto JSON con el token
            return Ok(new { token = token });
        }
        catch (NotAllowedException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}