using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Services;

public class UserService : IUserService
{
    // Cambiamos la lista estática por el repositorio
    private readonly IUserRepository _userRepository;

    // Inyectamos el repositorio en el constructor
    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        
        // Mapeamos de Entidad (Domain) a DTO (Application)
        return users.Select(u => new UserDto 
        { 
            Id = u.Id, 
            FirstName = u.FirstName, 
            LastName = u.LastName, 
            Email = u.Email, 
            Role = u.Role,
            BadgeNum = u.BadgeNum,
            CreatedAt = u.CreatedAt
        });
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        return new UserDto 
        { 
            Id = user.Id, 
            FirstName = user.FirstName, 
            LastName = user.LastName, 
            Email = user.Email, 
            Role = user.Role 
        };
    }

    public async Task<bool> CreateUserAsync(UserDto userDto)
    {
        var newUser = new User 
        {
            FirstName = userDto.FirstName,
            LastName = userDto.LastName,
            Email = userDto.Email,
            Role = userDto.Role,
            BadgeNum = userDto.BadgeNum
            // El Id y CreatedAt se manejan automáticamente en la base de datos/BaseEntity
        };

        await _userRepository.AddAsync(newUser);
        return true;
    }

    public async Task<bool> UpdateUserAsync(int id, UserDto userDto)
    {
        var existingUser = await _userRepository.GetByIdAsync(id);
        if (existingUser == null) return false;

        existingUser.FirstName = userDto.FirstName;
        existingUser.LastName = userDto.LastName;
        existingUser.Email = userDto.Email;
        existingUser.Role = userDto.Role;

        await _userRepository.UpdateAsync(existingUser);
        return true;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        await _userRepository.DeleteAsync(id);
        return true;
    }
}