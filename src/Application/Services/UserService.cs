using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions;
using ClubApp.Application.Requests;


namespace ClubApp.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();

        return users.Select(u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Role = u.Role,
            BadgeNum = u.BadgeNum,
            CreatedAt = u.CreatedAt,
        }).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role
        };
    }

    public async Task<bool> CreateUserAsync(UserRegisterDto userDto)
    {
        if (string.IsNullOrWhiteSpace(userDto.Email))
        {
            throw new AppValidationException("El correo electrónico es un campo obligatorio.");
        }

        // 1. Generacion de BadgeNum
        var allUsers = await _userRepository.GetAllAsync();

        int nextNumber = allUsers.Any() ? allUsers.Max(u => int.Parse(u.BadgeNum)) + 1 : 1;
        string generatedBadgeNum = nextNumber.ToString("D3");

        // 2. Creacion del usuario
        var newUser = new User
        {
            FirstName = userDto.FirstName,
            LastName = userDto.LastName,
            Email = userDto.Email,

            // 3. Hasheo real de contraseña
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password),

            // 4. Valores automáticos
            Role = 0, // Member
            BadgeNum = generatedBadgeNum,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(newUser);
        return true;
    }

    public async Task<bool> UpdateUserAsync(int id, UserDto userDto)
    {
        var existingUser = await _userRepository.GetByIdAsync(id);
        if (existingUser == null)
        {
            throw new NotFoundException("User", id);
        }

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
        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        await _userRepository.DeleteAsync(id);
        return true;
    }

    public async Task<bool> UpdateBasicInfoAsync(int id, UpdateUserBasicRequest request)
    {
        // 1. Buscamos al usuario en la base de datos
        var user = await _userRepository.GetByIdAsync(id); // O el método que uses para buscar

        if (user == null) return false;

        // 2. Actualizamos los campos básicos
        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;

        // 3. Guardamos los cambios
        await _userRepository.UpdateAsync(user);
        return true;
    }
}