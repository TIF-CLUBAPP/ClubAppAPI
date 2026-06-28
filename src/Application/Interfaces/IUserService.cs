using ClubApp.Application.Dtos;
using ClubApp.Application.Requests;

namespace ClubApp.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto> GetUserByIdAsync(int id);
    Task<bool> CreateUserAsync(UserRegisterDto userDto);
    Task<bool> UpdateUserAsync(int id, UserDto userDto);
    Task<bool> DeleteUserAsync(int id);
    Task<bool> UpdateBasicInfoAsync(int id, UpdateUserBasicRequest request);

}