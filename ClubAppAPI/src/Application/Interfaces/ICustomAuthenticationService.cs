using System.Threading.Tasks;
using ClubApp.Application.Models.Request;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    Task<string?> AuthenticationAsync(AuthenticationRequest request);

    // Registro tradicional
    Task<(bool Success, string? ErrorMessage)> RegisterAsync(ClubApp.Application.Dtos.UserRegisterDto dto);

    // Autenticación/Registro con Google. If user created but lacks profile, return requiresCompletion flag in tuple.
    Task<(bool Success, string? Token, bool RequiresProfileCompletion, int? UserId, string? ErrorMessage)> GoogleSignInAsync(ClubApp.Application.Dtos.GoogleAuthDto dto);

    // Completar perfil para usuarios creados vía Google. Devuelve token JWT si todo OK.
    Task<(bool Success, string? Token, string? ErrorMessage)> CompleteGoogleProfileAsync(ClubApp.Application.Dtos.CompleteProfileDto dto);

    // Recuperación de contraseña
    Task<(bool Success, string? ErrorMessage)> ForgotPasswordAsync(ClubApp.Application.Dtos.ForgotPasswordDto dto);
    Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(ClubApp.Application.Dtos.ResetPasswordDto dto);
}