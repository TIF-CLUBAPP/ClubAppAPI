using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly ApplicationContext _context;

    public AttendanceService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherClassDto>> GetTeacherClassesAsync(int teacherId, DateTime date)
    {
        var dayOfWeek = (int)date.DayOfWeek;

        var schedules = await _context.ActivitySchedules
            .Include(s => s.Activity)
                .ThenInclude(a => a.Instructors)
            .Where(s => s.DayOfWeek == dayOfWeek
                && s.Activity.IsActive
                && (s.Activity.TeacherId == teacherId
                    || s.Activity.Instructors.Any(i => i.UserId == teacherId)))
            .ToListAsync();

        // SQLite no soporta ORDER BY sobre columnas TimeSpan; se ordena en memoria.
        schedules = schedules.OrderBy(s => s.StartTime).ToList();

        var result = new List<TeacherClassDto>();
        foreach (var schedule in schedules)
        {
            var enrollments = await _context.Enrollments
                .Where(e => e.ActivityId == schedule.ActivityId)
                .ToListAsync();

            var studentIds = enrollments
                .Where(e => e.Status == EnrollmentStatus.ACTIVE)
                .Select(e => e.UserId)
                .ToList();

            var students = await _context.Users
                .Where(u => studentIds.Contains(u.Id))
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .ToListAsync();

            var records = await _context.AttendanceRecords
                .Where(r => r.ActivityScheduleId == schedule.Id && r.Date == date.Date)
                .ToListAsync();

            // Histórico completo de asistencia de esta clase (todas las fechas),
            // agrupado por alumno para armar el resumen personal de cada uno.
            var history = await _context.AttendanceRecords
                .Where(r => r.ActivityScheduleId == schedule.Id)
                .GroupBy(r => r.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Total = g.Count(),
                    Presents = g.Count(r => r.Status == AttendanceStatus.PRESENT),
                    Absents = g.Count(r => r.Status == AttendanceStatus.ABSENT),
                    Justified = g.Count(r => r.Status == AttendanceStatus.JUSTIFIED),
                })
                .ToDictionaryAsync(x => x.UserId);

            result.Add(new TeacherClassDto
            {
                ActivityId = schedule.ActivityId,
                ActivityName = schedule.Activity.Name,
                ActivityScheduleId = schedule.Id,
                StartTime = schedule.StartTime.ToString(@"hh\:mm"),
                EndTime = schedule.EndTime.ToString(@"hh\:mm"),
                Students = students.Select(u =>
                {
                    var record = records.FirstOrDefault(r => r.UserId == u.Id);
                    var enrollment = enrollments
                        .Where(e => e.UserId == u.Id)
                        .OrderByDescending(e => e.CreatedAt)
                        .FirstOrDefault();

                    history.TryGetValue(u.Id, out var stats);

                    return new ClassStudentDto
                    {
                        UserId = u.Id,
                        FullName = u.FullName,
                        Email = u.Email,
                        Status = record?.Status ?? AttendanceStatus.ABSENT,
                        EnrollmentDate = enrollment?.EnrollmentDate,
                        EnrollmentStatus = enrollment == null
                            ? nameof(EnrollmentStatus.CANCELED)
                            : enrollment.Status.ToString(),
                        TotalClasses = stats?.Total ?? 0,
                        Presents = stats?.Presents ?? 0,
                        Absents = stats?.Absents ?? 0,
                        Justified = stats?.Justified ?? 0
                    };
                }).ToList()
            });
        }

        return result;
    }

    public async Task<bool> MarkAttendanceAsync(int teacherId, MarkAttendanceRequest request)
    {
        var schedule = await _context.ActivitySchedules
            .Include(s => s.Activity)
                .ThenInclude(a => a.Instructors)
            .FirstOrDefaultAsync(s => s.Id == request.ActivityScheduleId);

        if (schedule == null) throw new NotFoundException("ActivitySchedule", request.ActivityScheduleId);

        if (schedule.Activity.TeacherId != teacherId
            && !schedule.Activity.Instructors.Any(i => i.UserId == teacherId))
            throw new NotAllowedException("No tenés permisos para registrar asistencia en esta clase.");

        var date = request.Date.Date;

        foreach (var item in request.Attendances)
        {
            var existing = await _context.AttendanceRecords
                .FirstOrDefaultAsync(r =>
                    r.ActivityScheduleId == schedule.Id &&
                    r.UserId == item.UserId &&
                    r.Date == date);

            if (existing == null)
            {
                _context.AttendanceRecords.Add(new AttendanceRecord
                {
                    ActivityScheduleId = schedule.Id,
                    UserId = item.UserId,
                    Date = date,
                    Status = item.Status,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.Status = item.Status;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}