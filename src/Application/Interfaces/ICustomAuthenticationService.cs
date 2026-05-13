using ClubApp.Application.Models.Requests;

namespace ClubApp.Application.Interfaces;

public interface ICustomAuthenticationService
{
    string Autenticar(AuthenticationRequest authenticationRequest);
}