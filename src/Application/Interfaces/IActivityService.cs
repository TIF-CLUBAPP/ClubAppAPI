using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync();
    Task<bool> CreateActivityAsync(ActivityDto dto);
    Task<bool> UpdateActivityAsync(int activityId, ActivityDto dto);
    Task<bool> DeleteActivityAsync(int activityId);
    Task<bool> EnrollMemberAsync(int userId, int activityId); 
}