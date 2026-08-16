using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions;
using ClubApp.Application.Models.Request;
using ClubApp.Models.DTOs;
using ClubApp.Application.DTOs;

namespace ClubApp.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync(string? searchQuery = null, UserRole? role = null, bool? isActive = null)
    {
        var users = await _userRepository.GetFilteredAsync(searchQuery, role, isActive);

        return users.Select(u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            FullName = u.FullName,
            Email = u.Email,
            Dni = u.Dni,
            Phone = u.Phone,
            BirthDate = u.BirthDate,
            Role = u.Role,
            IsActive = u.IsActive,
            IsBlocked = !u.IsActive,
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
            FullName = user.FullName,
            Email = user.Email,
            Dni = user.Dni,
            Phone = user.Phone,
            BirthDate = user.BirthDate,
            Role = user.Role,
            IsActive = user.IsActive,
            IsBlocked = !user.IsActive,
            BadgeNum = user.BadgeNum,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto> CreateUserAsync(UserRegisterDto userDto)
    {
        if (string.IsNullOrWhiteSpace(userDto.Email))
        {
            throw new AppValidationException("El correo electrónico es un campo obligatorio.");
        }

        // 1. Generación de BadgeNum
        var allUsers = await _userRepository.GetAllAsync();

        int nextNumber = allUsers.Any() ? allUsers.Max(u => int.Parse(u.BadgeNum)) + 1 : 1;
        string generatedBadgeNum = nextNumber.ToString("D3");

        // 2. Creación del usuario
        var newUser = new User
        {
            FirstName = userDto.FirstName,
            LastName = userDto.LastName,
            Email = userDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
            Role = 0,
            BadgeNum = generatedBadgeNum,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(newUser); 

        return new UserDto
        {
            Id = newUser.Id,
            FirstName = newUser.FirstName,
            LastName = newUser.LastName,
            Email = newUser.Email,
            Role = newUser.Role,
            BadgeNum = newUser.BadgeNum,
            CreatedAt = newUser.CreatedAt
        };
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

        // Soft delete: conservamos el registro para no romper referencias (enrollments,
        // memberships, pagos), pero el usuario deja de aparecer en la gestión.
        user.IsDeleted = true;
        user.IsActive = false;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> SetUserStatusAsync(int id, bool isActive)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        user.IsActive = isActive;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> UpdateBasicInfoAsync(int id, UpdateUserBasicRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null) return false;

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        bool contrasenaActualValida = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);

        if (!contrasenaActualValida) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> UpdateUserRoleAsync(int id, UpdateRoleDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        user.Role = (UserRole)dto.NewRole;

        await _userRepository.UpdateAsync(user);
        return true;
    }
}