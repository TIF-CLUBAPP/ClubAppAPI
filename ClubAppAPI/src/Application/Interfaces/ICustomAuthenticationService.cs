using System.Threading.Tasks;
using ClubApp.Application.Models.Request;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    Task<(string? Token, User? User)> AuthenticationAsync(AuthenticationRequest request);

    // Registro tradicional
    Task<(bool Success, string? ErrorMessage)> RegisterAsync(ClubApp.Application.Dtos.UserRegisterDto dto);

    // Autenticación/Registro con Google. If user created but lacks profile, return requiresCompletion flag in tuple.
    Task<(bool Success, string? Token, bool RequiresProfileCompletion, int? UserId, User? User, string? ErrorMessage)> GoogleSignInAsync(ClubApp.Application.Dtos.GoogleAuthDto dto);

    // Completar perfil para usuarios creados vía Google. Devuelve token JWT si todo OK.
    Task<(bool Success, string? Token, User? User, string? ErrorMessage)> CompleteGoogleProfileAsync(ClubApp.Application.Dtos.CompleteProfileDto dto);

    // Recuperación de contraseña con código de 6 dígitos
    Task<(bool Success, bool UserExists, string? ErrorMessage)> ForgotPasswordAsync(ClubApp.Application.Dtos.ForgotPasswordDto dto);
    Task<(bool Success, string? ErrorMessage)> VerifyResetCodeAsync(ClubApp.Application.Dtos.VerifyResetCodeDto dto);
    Task<(bool Success, string? ErrorMessage)> ResetPasswordWithCodeAsync(ClubApp.Application.Dtos.ResetPasswordWithCodeDto dto);

    // Recuperación por enlace (legacy): se mantiene por compatibilidad con el flujo anterior.
    Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(ClubApp.Application.Dtos.ResetPasswordDto dto);
}