using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Services;

public class UserService : IUserService
{
    private static List<UserDto> _users = new List<UserDto>
    {
        new UserDto { Id = 1, FirstName = "Admin", LastName = "Principal", Email = "admin@club.com", Role = "ADMIN", BadgeNum = "A001" }
    };

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        return await Task.FromResult(_users);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = _users.FirstOrDefault(u => u.Id == id);
        return await Task.FromResult(user);
    }

    public async Task<bool> CreateUserAsync(UserDto userDto)
    {
        userDto.Id = _users.Any() ? _users.Max(u => u.Id) + 1 : 1;
        userDto.CreatedAt = DateTime.Now;
        _users.Add(userDto);
        return await Task.FromResult(true);
    }

    public async Task<bool> UpdateUserAsync(int id, UserDto userDto)
    {
        var existingUser = _users.FirstOrDefault(u => u.Id == id);
        if (existingUser == null) return false;

        existingUser.FirstName = userDto.FirstName;
        existingUser.LastName = userDto.LastName;
        existingUser.Email = userDto.Email;
        existingUser.Role = userDto.Role;
        
        return await Task.FromResult(true);
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = _users.FirstOrDefault(u => u.Id == id);
        if (user == null) return false;

        _users.Remove(user);
        return await Task.FromResult(true);
    }
}