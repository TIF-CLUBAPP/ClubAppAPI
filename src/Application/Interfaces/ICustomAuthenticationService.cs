using ClubApp.Application.Requests;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    Task<string> Autenticar(AuthenticationRequest authenticationRequest);
}