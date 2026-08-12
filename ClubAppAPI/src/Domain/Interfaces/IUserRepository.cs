using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces;

public interface IUserRepository : IRepositoryBase<User>
{
    // Agregamos este método para buscar al usuario por su UserName
    Task<User?> GetUserByEmail(string email);

    /// <summary>
    /// Lista de usuarios con búsqueda y filtros opcionales (para la gestión de socios).
    /// Excluye siempre a los usuarios con soft delete.
    /// </summary>
    /// <param name="searchQuery">Texto libre: Nombre, Apellido, DNI, Teléfono o Email.</param>
    /// <param name="role">Filtro opcional por rol.</param>
    /// <param name="isActive">Filtro opcional por estado: true=Activo, false=Bloqueado.</param>
    Task<List<User>> GetFilteredAsync(string? searchQuery = null, UserRole? role = null, bool? isActive = null);
}