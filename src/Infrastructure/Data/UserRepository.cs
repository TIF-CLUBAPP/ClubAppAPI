using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Data;

public class UserRepository : RepositoryBase<User>, IUserRepository 
{

    // Le pasamos el context al constructor y lo guardamos en nuestra variable privada
    public UserRepository(ApplicationContext context) : base(context)
    {
    }

    // Implementamos el método para buscar por Email de forma asincrónica
    public async Task<User?> GetUserByEmail(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }
}