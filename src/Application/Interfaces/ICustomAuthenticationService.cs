using System.Threading.Tasks;
using ClubApp.Application.Requests;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    // Dejamos un ÚNICO método limpio para que no te tire más error de implementación
    Task<string?> AuthenticationAsync(AuthenticationRequest request);
}