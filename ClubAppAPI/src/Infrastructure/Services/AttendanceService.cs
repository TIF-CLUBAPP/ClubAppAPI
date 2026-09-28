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
            .Where(s => s.DayOfWeek == dayOfWeek && s.Activity.TeacherId == teacherId && s.Activity.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        var result = new List<TeacherClassDto>();
        foreach (var schedule in schedules)
        {
            var studentIds = await _context.Enrollments
                .Where(e => e.ActivityId == schedule.ActivityId && e.Status == EnrollmentStatus.ACTIVE)
                .Select(e => e.UserId)
                .ToListAsync();

            var students = await _context.Users
                .Where(u => studentIds.Contains(u.Id))
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .ToListAsync();

            var records = await _context.AttendanceRecords
                .Where(r => r.ActivityScheduleId == schedule.Id && r.Date == date.Date)
                .ToListAsync();

            result.Add(new TeacherClassDto
            {
                ActivityId = schedule.ActivityId,
                ActivityName = schedule.Activity.Name,
                ActivityScheduleId = schedule.Id,
                StartTime = schedule.StartTime.ToString(@"hh\:mm"),
                EndTime = schedule.EndTime.ToString(@"hh\:mm"),
                Students = students.Select(u => new ClassStudentDto
                {
                    UserId = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Present = records.Any(r => r.UserId == u.Id && r.Present)
                }).ToList()
            });
        }

        return result;
    }

    public async Task<bool> MarkAttendanceAsync(int teacherId, MarkAttendanceRequest request)
    {
        var schedule = await _context.ActivitySchedules
            .Include(s => s.Activity)
            .FirstOrDefaultAsync(s => s.Id == request.ActivityScheduleId);

        if (schedule == null) throw new NotFoundException("ActivitySchedule", request.ActivityScheduleId);

        if (schedule.Activity.TeacherId != teacherId)
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
                    Present = item.Present,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.Present = item.Present;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}