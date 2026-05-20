using System.Threading.Tasks;
using ClubApp.Application.Requests;

namespace ClubApp.Application.Interfaces
{
    public interface ICustomAuthenticationService
    {
        Task<string?> AuthenticationAsync(AuthenticationRequest request);
    }
}