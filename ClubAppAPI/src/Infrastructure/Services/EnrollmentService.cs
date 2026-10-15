using System.Globalization;
using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly ApplicationContext _context;
    private readonly IPaymentService _paymentService;

    public EnrollmentService(ApplicationContext context, IPaymentService paymentService)
    {
        _context = context;
        _paymentService = paymentService;
    }

    public async Task<IEnumerable<Enrollment>> GetAllEnrollmentsAsync()
    {
        return await _context.Enrollments
            .Include(e => e.Activity)
            .Include(e => e.User)
            .ToListAsync();
    }

    public async Task<Enrollment?> GetEnrollmentByIdAsync(int id)
    {
        return await _context.Enrollments
            .Include(e => e.Activity)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<string> CreateEnrollmentAsync(int userId, CreateEnrollmentDto dto)
    {
        // Se evalúa la regla configurada de corte de servicio / suspensión por mora
        // (meses y/o monto según condición OR/AND).
        var suspensionReason = await _paymentService.GetSuspensionReasonAsync(userId);
        if (suspensionReason != null)
        {
            return suspensionReason;
        }

        var activity = await _context.Activities.FindAsync(dto.ActivityId);
        if (activity == null) return "La actividad no existe.";
        if (!activity.IsActive) return "La actividad no esta disponible.";

        var alreadyEnrolled = await _context.Enrollments
            .AnyAsync(e => e.ActivityId == dto.ActivityId && e.UserId == userId && e.Status == EnrollmentStatus.ACTIVE);
        if (alreadyEnrolled) return "Ya estas inscrito en esta actividad.";

        var currentReservations = await _context.Enrollments
            .CountAsync(e => e.ActivityId == dto.ActivityId && e.Status == EnrollmentStatus.ACTIVE);

        if (currentReservations >= activity.MaxCapacity) return "No hay cupos disponibles.";

        var enrollment = new Enrollment
        {
            UserId = userId,
            ActivityId = dto.ActivityId,
            EnrollmentDate = DateTime.UtcNow,
            Status = EnrollmentStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Enrollments.AddAsync(enrollment);
        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<IEnumerable<MyEnrollmentDto>> GetMyEnrollmentsAsync(int userId)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Activity)
                .ThenInclude(a => a.Teacher)
            .Include(e => e.Activity)
                .ThenInclude(a => a.Space)
            .Include(e => e.Activity)
                .ThenInclude(a => a.Schedules)
            .Include(e => e.Activity)
                .ThenInclude(a => a.Instructors)
                .ThenInclude(i => i.User)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.EnrollmentDate)
            .ToListAsync();

        var result = new List<MyEnrollmentDto>();
        foreach (var e in enrollments)
        {
            var instructorName = e.Activity.Teacher?.FullName
                ?? e.Activity.Instructors
                    .OrderBy(i => i.User.FullName)
                    .Select(i => i.User.FullName)
                    .FirstOrDefault();

            result.Add(new MyEnrollmentDto
            {
                Id = e.Id,
                ActivityId = e.ActivityId,
                ActivityName = e.Activity.Name,
                SpaceName = e.Activity.Space?.Name,
                InstructorName = instructorName,
                Status = e.Status.ToString(),
                EnrollmentDate = e.EnrollmentDate,
                Schedules = e.Activity.Schedules
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
            });
        }

        return result;
    }

    public async Task<string> CancelEnrollmentAsync(int enrollmentId, int loggedInUserId, string loggedInUserRole)
    {
        var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
        if (enrollment == null) return "NOT_FOUND";

        if (loggedInUserRole != "ADMIN" && loggedInUserRole != "SUPERADMIN" && enrollment.UserId != loggedInUserId)
        {
            return "NOT_AUTHORIZED";
        }

        if (enrollment.Status == EnrollmentStatus.CANCELED) return "ALREADY_CANCELED";

        enrollment.Status = EnrollmentStatus.CANCELED;
        await _context.SaveChangesAsync();
        return "OK";
    }
}
