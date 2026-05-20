using ClubApp.Application.Interfaces;
using ClubApp.Application.Requests;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ClubApp.Infrastructure.Services
{
    public class AutenticacionService : ICustomAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly AutenticacionServiceOptions _options;

        public AutenticacionService(IUserRepository userRepository, IOptions<AutenticacionServiceOptions> options)
        {
            _userRepository = userRepository;
            _options = options.Value;
        }

        private async Task<User?> ValidateUser(AuthenticationRequest authenticationRequest)
        {
            if (string.IsNullOrEmpty(authenticationRequest.UserName) || string.IsNullOrEmpty(authenticationRequest.Password))
                return null;

            // Llamada asincrónica al repositorio
            var user = await _userRepository.GetUserByEmail(authenticationRequest.UserName);

            if (user == null) return null;

            // Validación directa de contraseña (si usan texto plano como el profesor)
            if (user.PasswordHash == authenticationRequest.Password)
                return user;

            return null;
        }

        public async Task<string> Autenticar(AuthenticationRequest authenticationRequest)
        {
            var user = await ValidateUser(authenticationRequest);

            if (user == null)
            {
                throw new Exception("User authentication failed"); // Usamos Exception común para evitar errores de compilación
            }

            var securityPassword = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_options.SecretForKey));
            var credentials = new SigningCredentials(securityPassword, SecurityAlgorithms.HmacSha256);

            var claimsForToken = new List<Claim>
            {
                new Claim("sub", user.Id.ToString()),
                new Claim("given_name", user.FirstName ?? string.Empty),
                new Claim("family_name", user.LastName ?? string.Empty),
                new Claim("role", user.Role.ToString()) // El rol sale de la base de datos, no del request
            };

            var jwtSecurityToken = new JwtSecurityToken(
              _options.Issuer,
              _options.Audience,
              claimsForToken,
              DateTime.UtcNow,
              DateTime.UtcNow.AddHours(1),
              credentials);

            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        public class AutenticacionServiceOptions
        {
            public const string AutenticacionService = "AutenticacionService";
            public string Issuer { get; set; } = string.Empty;
            public string Audience { get; set; } = string.Empty;
            public string SecretForKey { get; set; } = string.Empty;
        }
    }
}