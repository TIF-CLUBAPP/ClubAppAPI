using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Requests;
using ClubApp.Domain.Interfaces; 
using Microsoft.Extensions.Configuration; 
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net; // Asegúrate de tener instalado el paquete BCrypt.Net-Next

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

            // Buscamos al usuario por nombre o email
            var user = users.FirstOrDefault(u => u.FirstName == request.UserName || u.Email == request.UserName);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

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
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FirstName),
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
    }
}