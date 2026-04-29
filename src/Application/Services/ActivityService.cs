using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Services;

public class ActivityService : IActivityService
{
    public async Task<bool> UpdateActivityAsync(int activityId, ActivityDto dto)
    {
        var existing = _activities.FirstOrDefault(a => a.Id == activityId);
        if (existing == null) return false;

        existing.Name = dto.Name;
        existing.Schedule = dto.Schedule;
        existing.AvailableSlots = dto.AvailableSlots;
        return true;
    }

    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        var activity = _activities.FirstOrDefault(a => a.Id == activityId);
        if (activity == null) return false;

        _activities.Remove(activity);
        return true;
    }

    // Lista estática para simular la base de datos
    private static List<ActivityDto> _activities = new List<ActivityDto>
    {
        new ActivityDto { Id = 1, Name = "Fútbol", Schedule = "Lunes 18:00", AvailableSlots = 20 },
        new ActivityDto { Id = 2, Name = "Gimnasio", Schedule = "Martes 10:00", AvailableSlots = 15 }
    };

    public async Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync()
    {
        return await Task.FromResult(_activities);
    }

    public async Task<bool> CreateActivityAsync(ActivityDto activityDto)
    {
        // Simulamos la generación de un ID
        activityDto.Id = _activities.Any() ? _activities.Max(a => a.Id) + 1 : 1;
        _activities.Add(activityDto);
        return await Task.FromResult(true);
    }

    public async Task<bool> EnrollMemberAsync(int userId, int activityId)
    {
        var activity = _activities.FirstOrDefault(a => a.Id == activityId);
        if (activity != null && activity.AvailableSlots > 0)
        {
            activity.AvailableSlots--; // Simulamos la inscripción restando un cupo
            return await Task.FromResult(true);
        }
        return await Task.FromResult(false);
    }


}