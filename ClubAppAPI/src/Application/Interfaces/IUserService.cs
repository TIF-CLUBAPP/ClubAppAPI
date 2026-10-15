using ClubApp.Application.Dtos;
using ClubApp.Application.DTOs;
using ClubApp.Application.Models.Request;
using ClubApp.Domain.Entities;
using ClubApp.Models.DTOs;

namespace ClubApp.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync(string? searchQuery = null, UserRole? role = null, bool? isActive = null);
    Task<UserDto> GetUserByIdAsync(int id);
    Task<UserDto> CreateUserAsync(UserRegisterDto userDto); 
    Task<bool> UpdateUserAsync(int id, UserDto userDto);
    Task<bool> DeleteUserAsync(int id);
    Task<bool> UpdateBasicInfoAsync(int id, UpdateUserBasicRequest request);
    Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto);
    Task<bool> UpdateUserRoleAsync(int id, UpdateRoleDto dto);
    Task<bool> SetUserStatusAsync(int id, bool isActive);

    /// <summary>Configuración de cobro directo de un profesor. Null si no existe / no es TEACHER.</summary>
    Task<TeacherPayoutSettingsDto?> GetTeacherPayoutSettingsAsync(int teacherId);

    /// <summary>Permite/deniega el cobro directo y guarda los datos de cobro del profesor.</summary>
    Task<TeacherPayoutSettingsDto?> UpdateTeacherPayoutSettingsAsync(int teacherId, TeacherPayoutSettingsRequest request);

    /// <summary>Configuración de cobro del usuario autenticado (Alias/CBU + estado MP). Null si no existe.</summary>
    Task<ProfilePaymentInfoDto?> GetProfilePaymentInfoAsync(int userId);

    /// <summary>Guarda el Alias/CBU/CVU del usuario autenticado desde su perfil.</summary>
    Task<ProfilePaymentInfoDto?> SaveProfilePaymentInfoAsync(int userId, SaveProfilePaymentInfoRequest request);
}