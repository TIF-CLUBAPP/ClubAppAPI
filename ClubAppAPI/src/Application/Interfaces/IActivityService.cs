using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Interfaces;

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync();
    Task<ActivityDto?> GetActivityByIdAsync(int activityId);
    Task<ActivityDto> CreateActivityAsync(SaveActivityRequest dto, int actorId, UserRole actorRole);
    Task<bool> UpdateActivityAsync(int activityId, SaveActivityRequest dto, int actorId, UserRole actorRole);
    Task<bool> DeleteActivityAsync(int activityId, int actorId, UserRole actorRole);
    Task<bool> EnrollMemberAsync(int userId, int activityId);
}