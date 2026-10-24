using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Web.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly ICustomAuthenticationService _authService;
    private readonly ApplicationContext _context; // TEMP: solo para diagnosticar la ruta de la BD
    private readonly ILogger<AuthController> _logger;

    public AuthController(ICustomAuthenticationService authService, ApplicationContext context, ILogger<AuthController> logger)
    {
        _authService = authService;
        _context = context;
        _logger = logger;
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

        // TEMP (diagnóstico): log del email recibido y de la ruta absoluta de la BD activa.
        var dbPath = _context.Database.GetDbConnection().DataSource;
        _logger.LogInformation(
            "[Diagnóstico ForgotPassword] Email recibido: '{Email}'. BD activa (DataSource): '{DbPath}'.",
            dto.Email, dbPath);

        var (success, userExists, error) = await _authService.ForgotPasswordAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new
        {
            exists = userExists,
            message = userExists
                ? "Te enviamos un código de verificación a tu correo."
                : "El correo ingresado no posee una cuenta registrada."
        });
    }

    [HttpPost("verify-reset-code")]
    public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _authService.VerifyResetCodeAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Código verificado correctamente." });
    }

    [HttpPost("reset-password-code")]
    public async Task<IActionResult> ResetPasswordWithCode([FromBody] ResetPasswordWithCodeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _authService.ResetPasswordWithCodeAsync(dto);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "La contraseña ha sido restablecida con éxito." });
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
