using ClubApp.Application.Interfaces;
using ClubApp.Application.Requests;
using ClubApp.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ClubApp.Web.Controllers;

[Route("api/authentication")]
[ApiController]
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
            // 1. Llamamos al método asincrónico correcto usando el nombre exacto de la interfaz
            string? token = await _customAuthenticationService.AuthenticationAsync(authenticationRequest);

            if (token == null)
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
            }

            // 2. Devolvemos un objeto con la propiedad token para que sea fácil de leer en la web
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