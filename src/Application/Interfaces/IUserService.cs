using ClubApp.Application.Dtos;
using ClubApp.Application.DTOs;
using ClubApp.Application.Requests;
using ClubApp.Models.DTOs;

namespace ClubApp.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto> GetUserByIdAsync(int id);
    Task<bool> CreateUserAsync(UserRegisterDto userDto);
    Task<bool> UpdateUserAsync(int id, UserDto userDto);
    Task<bool> DeleteUserAsync(int id);
    Task<bool> UpdateBasicInfoAsync(int id, UpdateUserBasicRequest request);
    Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto);
    Task<bool> UpdateUserRoleAsync(int id, UpdateRoleDto dto);
}