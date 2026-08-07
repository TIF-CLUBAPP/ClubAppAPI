using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Models.Request;
using ClubApp.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using Google.Apis.Auth;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Infrastructure.Services
{
    public class AutenticacionService : ICustomAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AutenticacionService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<string?> AuthenticationAsync(AuthenticationRequest request)
        {
            var users = await _userRepository.GetAllAsync();

            var user = users.FirstOrDefault(u => u.FirstName == request.Email || u.Email == request.Email);

            if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                System.Diagnostics.Debug.WriteLine("Intento de inicio de sesión fallido: Credenciales inválidas.");
                return null;
            }

            return GenerateToken(user);
        }

        public async Task<(bool Success, string? ErrorMessage)> RegisterAsync(UserRegisterDto dto)
        {
            // Política: permitir creación de cuenta aunque sea menor de edad.
            // Los checks sobre suscripción/pagos se deben aplicar en las rutas de suscripción futuras.

            var users = await _userRepository.GetAllAsync();
            if (users.Any(u => u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase)))
            {
                return (false, "El correo electrónico ya está registrado.");
            }

            if (users.Any(u => u.Dni == dto.Dni))
            {
                return (false, "El DNI ya está registrado.");
            }

            var newUser = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Dni = dto.Dni,
                Phone = dto.Phone,
                BirthDate = dto.BirthDate,
                Role = UserRole.MEMBER
            };

            await _userRepository.AddAsync(newUser);
            return (true, null);
        }

        public async Task<(bool Success, string? Token, bool RequiresProfileCompletion, int? UserId, string? ErrorMessage)> GoogleSignInAsync(GoogleAuthDto dto)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
            }
            catch (Exception ex)
            {
                return (false, null, false, null, $"Token de Google inválido: {ex.Message}");
            }

            if (string.IsNullOrEmpty(payload?.Email))
            {
                return (false, null, false, null, "El token de Google no contiene correo electrónico.");
            }

            var existing = await _userRepository.GetUserByEmail(payload.Email);
            if (existing != null)
            {
                // Asociar GoogleId si aún no está
                if (string.IsNullOrEmpty(existing.GoogleId) && !string.IsNullOrEmpty(payload.Subject))
                {
                    existing.GoogleId = payload.Subject;
                    await _userRepository.UpdateAsync(existing);
                }

                // Si faltan datos personales requeridos, indicar completion
                if (string.IsNullOrEmpty(existing.Dni) || string.IsNullOrEmpty(existing.Phone) || !existing.BirthDate.HasValue)
                {
                    return (true, null, true, existing.Id, null);
                }

                // Generar token
                var token = GenerateToken(existing);
                return (true, token, false, existing.Id, null);
            }

            // Crear usuario base
            var newUser = new User
            {
                Email = payload.Email,
                FirstName = payload.GivenName ?? string.Empty,
                LastName = payload.FamilyName ?? string.Empty,
                GoogleId = payload.Subject,
                PasswordHash = string.Empty, // No password for Google-only accounts
                Role = UserRole.MEMBER
            };

            await _userRepository.AddAsync(newUser);

            // Indicar que se requiere completar perfil y devolver Id
            return (true, null, true, newUser.Id, null);
        }

        public async Task<(bool Success, string? Token, string? ErrorMessage)> CompleteGoogleProfileAsync(CompleteProfileDto dto)
        {
            // Política: permitir completar perfil aunque sea menor de edad. Restricción de suscripciones se manejará en endpoints de pago.

            var user = await _userRepository.GetByIdAsync(dto.UserId);
            if (user == null) return (false, null, "Usuario no encontrado.");

            // Validar que el DNI no esté registrado por otro usuario
            var users = await _userRepository.GetAllAsync();
            if (users.Any(u => u.Dni == dto.Dni && u.Id != dto.UserId))
            {
                return (false, null, "El DNI ya está registrado por otro usuario.");
            }

            user.Dni = dto.Dni;
            user.Phone = dto.Phone;
            user.BirthDate = dto.BirthDate;

            await _userRepository.UpdateAsync(user);

            // Generar token para iniciar sesión automático tras completar perfil
            var token = GenerateToken(user);
            return (true, token, null);
        }

        private string? GenerateToken(User user)
        {
            var secretKeyString = _configuration["Authentication:SecretForKey"];
            if (string.IsNullOrEmpty(secretKeyString))
            {
                secretKeyString = "esta_es_una_clave_secreta_de_auxilio_super_larga_12345";
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKeyString));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claimsForToken = new List<Claim>
            {
                new Claim("sub", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.FirstName ?? string.Empty),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var issuer = _configuration["Authentication:Issuer"] ?? "ClubAppAPI";
            var audience = _configuration["Authentication:Audience"] ?? "ClubAppUsers";

            var jwtSecurityToken = new JwtSecurityToken(
                issuer,
                audience,
                claimsForToken,
                DateTime.UtcNow,
                DateTime.UtcNow.AddHours(2),
                credentials);

            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        private int CalculateAge(DateTime? birthDate)
        {
            if (!birthDate.HasValue) return 0;
            var today = DateTime.UtcNow.Date;
            var age = today.Year - birthDate.Value.Date.Year;
            if (birthDate.Value.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}