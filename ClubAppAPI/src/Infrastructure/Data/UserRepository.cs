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

    /// <summary>
    /// Consulta de usuarios con búsqueda por texto libre y filtros opcionales.
    /// Siempre excluye a los usuarios eliminados (soft delete).
    /// </summary>
    public async Task<List<User>> GetFilteredAsync(string? searchQuery = null, UserRole? role = null, bool? isActive = null)
    {
        IQueryable<User> query = _context.Users
            .Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            string term = searchQuery.Trim().ToLower();
            query = query.Where(u =>
                (u.FirstName ?? string.Empty).ToLower().Contains(term) ||
                (u.LastName ?? string.Empty).ToLower().Contains(term) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(term) ||
                (u.Dni ?? string.Empty).ToLower().Contains(term) ||
                (u.Phone ?? string.Empty).ToLower().Contains(term) ||
                (u.Email ?? string.Empty).ToLower().Contains(term));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        return await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }
}