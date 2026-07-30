using System.Threading.Tasks;
using ClubApp.Application.Models.Request;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    Task<string?> AuthenticationAsync(AuthenticationRequest request);
}