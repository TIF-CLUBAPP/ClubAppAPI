using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly ApplicationContext _context;

    public EnrollmentService(ApplicationContext context)
    {
        _context = context;
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
        var activity = await _context.Activities.FindAsync(dto.ActivityId);
        if (activity == null) return "La actividad no existe.";
        if (!activity.IsActive) return "La actividad no está disponible.";

        var alreadyEnrolled = await _context.Enrollments
            .AnyAsync(e => e.ActivityId == dto.ActivityId && e.UserId == userId && e.Status == EnrollmentStatus.ACTIVE);
        if (alreadyEnrolled) return "Ya estás inscrito en esta actividad.";

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