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
    public async Task<ActionResult<string>> Autenticar([FromBody] AuthenticationRequest authenticationRequest) 
    {
        try
        {
            string token = await _customAuthenticationService.Autenticar(authenticationRequest); 
            return Ok(token);
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