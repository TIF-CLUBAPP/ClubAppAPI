using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces;

public interface IUserRepository : IRepositoryBase<User>
{
    // Agregamos este método para buscar al usuario por su UserName
    Task<User?> GetUserByEmail(string email);
}