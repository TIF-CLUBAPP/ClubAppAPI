using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Web.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly ICustomAuthenticationService _authService;

    public AuthController(ICustomAuthenticationService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _authService.RegisterAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Registro exitoso." });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleAuthDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, token, requiresCompletion, userId, user, error) = await _authService.GoogleSignInAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new
        {
            token,
            requiresProfileCompletion = requiresCompletion,
            userId,
            user = user == null ? null : MapUser(user)
        });
    }

    [HttpPost("complete-google-profile")]
    public async Task<IActionResult> CompleteGoogleProfile([FromBody] CompleteProfileDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, token, user, error) = await _authService.CompleteGoogleProfileAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new
        {
            message = "Perfil completado correctamente.",
            token,
            user = user == null ? null : MapUser(user)
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _authService.ForgotPasswordAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _authService.ResetPasswordAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "La contraseña ha sido restablecida con éxito." });
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
