using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;

namespace ClubApp.Application.Services; 

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepository;

    public ActivityService(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync()
    {
        var activities = await _activityRepository.GetAllAsync();

        return activities.Select(a => new ActivityDto
        {
            Id = a.Id,
            Name = a.Name,
            Schedule = a.Schedule,
            MaxCapacity = a.MaxCapacity,
            IsActive = a.IsActive
        });
    }

    public async Task<bool> CreateActivityAsync(ActivityDto dto)
    {
        var newActivity = new Activity
        {
            Name = dto.Name,
            Schedule = dto.Schedule,
            MaxCapacity = dto.MaxCapacity,
            IsActive = true
        };

        await _activityRepository.AddAsync(newActivity);
        return true;
    }

    public async Task<bool> UpdateActivityAsync(int activityId, ActivityDto dto)
    {
        var existing = await _activityRepository.GetByIdAsync(activityId);
        if (existing == null) return false;

        existing.Name = dto.Name;
        existing.Schedule = dto.Schedule;
        existing.MaxCapacity = dto.MaxCapacity;

        await _activityRepository.UpdateAsync(existing);
        return true;
    }

    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        var existing = await _activityRepository.GetByIdAsync(activityId);
        if (existing == null) return false;

        await _activityRepository.DeleteAsync(activityId);
        return true;
    }

    public async Task<bool> EnrollMemberAsync(int userId, int activityId)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        
        // Aquí podrías validar si hay cupo usando una lógica de Enrollments
        if (activity != null && activity.IsActive)
        {
            // Lógica de inscripción (normalmente crearías un registro en la tabla Enrollments)
            return true;
        }
        return false;
    }
}