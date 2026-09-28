using System.Globalization;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Services;

public class ActivityService : IActivityService
{
    private readonly ApplicationContext _context;

    public ActivityService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync()
    {
        var activities = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Schedules)
            .ToListAsync();

        var result = new List<ActivityDto>();
        foreach (var activity in activities)
        {
            result.Add(await MapAsync(activity));
        }
        return result;
    }

    public async Task<ActivityDto?> GetActivityByIdAsync(int activityId)
    {
        var activity = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Schedules)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) return null;
        return await MapAsync(activity);
    }

    public async Task<ActivityDto> CreateActivityAsync(SaveActivityRequest dto, int actorId, UserRole actorRole)
    {
        Validate(dto);

        // Un profesor solo puede crear actividades a su cargo.
        int? teacherId = actorRole == UserRole.TEACHER ? actorId : dto.TeacherId;

        var activity = new Activity
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            Category = dto.Category?.Trim() ?? string.Empty,
            Price = dto.Price,
            MaxCapacity = dto.MaxCapacity,
            TeacherId = teacherId,
            RequiresBooking = dto.RequiresBooking,
            Schedule = dto.Schedule?.Trim() ?? string.Empty,
            IsActive = dto.IsActive,
            Schedules = BuildSchedules(dto.Schedules)
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        return await MapAsync(activity);
    }

    public async Task<bool> UpdateActivityAsync(int activityId, SaveActivityRequest dto, int actorId, UserRole actorRole)
    {
        var existing = await _context.Activities
            .Include(a => a.Schedules)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (existing == null) throw new NotFoundException("Activity", activityId);

        EnsureCanManage(existing, actorId, actorRole);
        Validate(dto);

        existing.Name = dto.Name.Trim();
        existing.Description = dto.Description?.Trim() ?? string.Empty;
        existing.Category = dto.Category?.Trim() ?? string.Empty;
        existing.Price = dto.Price;
        existing.MaxCapacity = dto.MaxCapacity;
        existing.RequiresBooking = dto.RequiresBooking;
        existing.Schedule = dto.Schedule?.Trim() ?? string.Empty;
        existing.IsActive = dto.IsActive;

        if (actorRole != UserRole.TEACHER)
        {
            existing.TeacherId = dto.TeacherId;
        }

        _context.ActivitySchedules.RemoveRange(existing.Schedules);
        var newSchedules = BuildSchedules(dto.Schedules);
        foreach (var schedule in newSchedules)
        {
            schedule.ActivityId = existing.Id;
        }
        existing.Schedules = newSchedules;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteActivityAsync(int activityId, int actorId, UserRole actorRole)
    {
        var existing = await _context.Activities
            .Include(a => a.Schedules)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (existing == null) throw new NotFoundException("Activity", activityId);

        EnsureCanManage(existing, actorId, actorRole);

        _context.Activities.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EnrollMemberAsync(int userId, int activityId)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null) throw new NotFoundException("Activity", activityId);

        if (!activity.IsActive)
            throw new AppValidationException("La actividad seleccionada no se encuentra activa.");

        var currentEnrollments = await _context.Enrollments
            .CountAsync(e => e.ActivityId == activityId && e.Status == EnrollmentStatus.ACTIVE);

        if (currentEnrollments >= activity.MaxCapacity)
            throw new AppValidationException("No hay cupos disponibles para esta actividad.");

        _context.Enrollments.Add(new Enrollment
        {
            UserId = userId,
            ActivityId = activityId,
            EnrollmentDate = DateTime.UtcNow,
            Status = EnrollmentStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<ActivityDto> MapAsync(Activity activity)
    {
        var enrolledCount = await _context.Enrollments
            .CountAsync(e => e.ActivityId == activity.Id && e.Status == EnrollmentStatus.ACTIVE);

        return new ActivityDto
        {
            Id = activity.Id,
            Name = activity.Name,
            Description = activity.Description,
            Category = activity.Category,
            Price = activity.Price,
            MaxCapacity = activity.MaxCapacity,
            TeacherId = activity.TeacherId,
            TeacherName = activity.Teacher?.FullName,
            RequiresBooking = activity.RequiresBooking,
            Schedule = activity.Schedule,
            IsActive = activity.IsActive,
            EnrolledCount = enrolledCount,
            Schedules = activity.Schedules
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .Select(s => new ActivityScheduleDto
                {
                    Id = s.Id,
                    DayOfWeek = s.DayOfWeek,
                    DayName = CultureInfo.GetCultureInfo("es-AR").DateTimeFormat.GetDayName((DayOfWeek)s.DayOfWeek),
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm")
                })
                .ToList()
        };
    }

    private static void Validate(SaveActivityRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new AppValidationException("El nombre de la actividad es obligatorio.");

        if (dto.MaxCapacity < 0)
            throw new AppValidationException("La capacidad máxima no puede ser negativa.");

        if (dto.Price < 0)
            throw new AppValidationException("El precio no puede ser negativo.");
    }

    private static void EnsureCanManage(Activity activity, int actorId, UserRole actorRole)
    {
        if (actorRole == UserRole.ADMIN || actorRole == UserRole.SUPERADMIN)
            return;

        if (actorRole == UserRole.TEACHER && activity.TeacherId == actorId)
            return;

        throw new NotAllowedException("No tenés permisos para gestionar esta actividad.");
    }

    private static List<ActivitySchedule> BuildSchedules(List<ActivityScheduleInputDto> inputs)
    {
        var result = new List<ActivitySchedule>();
        foreach (var item in inputs ?? new List<ActivityScheduleInputDto>())
        {
            if (item.DayOfWeek < 0 || item.DayOfWeek > 6)
                throw new AppValidationException("El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado).");

            var start = ParseTime(item.StartTime, "inicio");
            var end = ParseTime(item.EndTime, "fin");
            if (end <= start)
                throw new AppValidationException("La hora de fin debe ser posterior a la de inicio.");

            result.Add(new ActivitySchedule
            {
                DayOfWeek = item.DayOfWeek,
                StartTime = start,
                EndTime = end,
                CreatedAt = DateTime.UtcNow
            });
        }
        return result;
    }

    private static TimeSpan ParseTime(string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new AppValidationException($"La hora de {field} es obligatoria.");

        if (TimeSpan.TryParse(value.Trim(), out var time))
            return time;

        throw new AppValidationException($"La hora de {field} no es válida. Usá el formato HH:mm.");
    }
}