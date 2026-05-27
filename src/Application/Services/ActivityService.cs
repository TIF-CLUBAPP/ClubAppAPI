using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions;

namespace ClubApp.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IEnrollmentRepository _enrollmentRepository;

    public ActivityService(
        IActivityRepository activityRepository,
        IEnrollmentRepository enrollmentRepository)
    {
        _activityRepository = activityRepository;
        _enrollmentRepository = enrollmentRepository;
    }

    public async Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync()
    {
        var activities = await _activityRepository.GetAllAsync();

        return activities.Select(a => new ActivityDto
        {
            Name = a.Name, 
            Description = a.Description,
            Schedule = a.Schedule,
            MaxCapacity = a.MaxCapacity,
            IsActive = a.IsActive
        }).ToList();
    }

    public async Task<bool> CreateActivityAsync(ActivityDto dto)
    {
        if (dto.MaxCapacity <= 0)
        {
            throw new AppValidationException("La capacidad máxima debe ser mayor a cero.");
        }

        var newActivity = new Activity
        {
            Name = dto.Name,
            Description = dto.Description,
            Schedule = dto.Schedule,
            MaxCapacity = dto.MaxCapacity,
            IsActive = dto.IsActive
        };

        await _activityRepository.AddAsync(newActivity);
        return true;
    }

    public async Task<bool> UpdateActivityAsync(int activityId, ActivityDto dto)
    {
        var existing = await _activityRepository.GetByIdAsync(activityId);
        if (existing == null)
        {
            throw new NotFoundException("Activity", activityId);
        }

        existing.Name = dto.Name;
        existing.Schedule = dto.Schedule;
        existing.MaxCapacity = dto.MaxCapacity;

        await _activityRepository.UpdateAsync(existing);
        return true;
    }

    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        var existing = await _activityRepository.GetByIdAsync(activityId);
        if (existing == null)
        {
            throw new NotFoundException("Activity", activityId);
        }

        await _activityRepository.DeleteAsync(activityId);
        return true;
    }

    // Este es el método que soluciona la lógica usando la tabla intermedia Enrollment
    public async Task<bool> EnrollMemberAsync(int userId, int activityId)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        if (activity == null)
        {
            throw new NotFoundException("Activity", activityId);
        }

        if (!activity.IsActive)
        {
            throw new AppValidationException("La actividad seleccionada no se encuentra activa.");
        }

        // Lógica de la tabla Enrollment: Contamos cuántos cupos van ocupados
        int currentEnrollments = await _enrollmentRepository.GetCountByActivityIdAsync(activityId);
        if (currentEnrollments >= activity.MaxCapacity)
        {
            throw new AppValidationException("No hay cupos disponibles para esta actividad.");
        }

        // Si todo está ok, guardamos en la tabla intermedia
        var enrollment = new Enrollment
        {
            UserId = userId,
            ActivityId = activityId,
            EnrollmentDate = DateTime.Now,
            Status = EnrollmentStatus.Active
        };

        await _enrollmentRepository.AddAsync(enrollment);
        return true;
    }
}