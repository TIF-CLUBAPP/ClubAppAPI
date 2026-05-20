using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Requests;
using ClubApp.Domain.Interfaces; // Para tu IUserRepository
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ClubApp.Infrastructure.Services
{
    public class AutenticacionService : ICustomAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly AutenticacionServiceOptions _options;

        public class AutenticacionServiceOptions
        {
            public string Issuer { get; set; } = string.Empty;
            public string Audience { get; set; } = string.Empty;
            public string SecretForKey { get; set; } = string.Empty;
        }

        public AutenticacionService(IUserRepository userRepository, IOptions<AutenticacionServiceOptions> options)
        {
            _userRepository = userRepository;
            _options = options.Value;
        }

        public async Task<string?> AuthenticationAsync(AuthenticationRequest request)
        {
            // 1. Traemos la lista del repositorio de forma asíncrona usando tu método base
            var users = await _userRepository.GetAllAsync();

            // Buscamos el usuario por su FirstName o su Email
            var user = users.FirstOrDefault(u => u.FirstName == request.UserName || u.Email == request.UserName);

            if (user == null) return null;

            // 2. Validar contraseña en texto plano (luego podrás meterle hash si querés)
            if (user.PasswordHash != request.Password)
            {
                return null;
            }

            // 3. Generación del Token JWT
            // Modificamos la línea para que use una clave de auxilio fija si _options.SecretForKey viene vacía
            var secretKeyString = string.IsNullOrEmpty(_options.SecretForKey)
                ? "esta_es_una_clave_secreta_de_auxilio_super_larga_12345"
                : _options.SecretForKey;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKeyString));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claimsForToken = new List<Claim>
            {
                new Claim("sub", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FirstName),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var jwtSecurityToken = new JwtSecurityToken(
                _options.Issuer,
                _options.Audience,
                claimsForToken,
                DateTime.UtcNow,
                DateTime.UtcNow.AddHours(2),
                credentials);

            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }
    }
}