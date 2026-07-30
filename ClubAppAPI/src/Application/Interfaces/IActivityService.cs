using ClubApp.Application.Models.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync();
    Task<ActivityDto?> GetActivityByIdAsync(int activityId);
    Task<ActivityDto> CreateActivityAsync(ActivityDto dto);
    Task<bool> UpdateActivityAsync(int activityId, ActivityDto dto);
    Task<bool> DeleteActivityAsync(int activityId);
    Task<bool> EnrollMemberAsync(int userId, int activityId);
}