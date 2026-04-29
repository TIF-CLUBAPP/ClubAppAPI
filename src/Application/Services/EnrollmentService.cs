using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Services;

public class EnrollmentService : IEnrollmentService
{
    // Lista estática para simular la base de datos de inscripciones
    private static List<EnrollmentDto> _enrollments = new List<EnrollmentDto>();

    public async Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync()
    {
        return await Task.FromResult(_enrollments);
    }

    public async Task<bool> CreateEnrollmentAsync(EnrollmentDto enrollmentDto)
    {
        enrollmentDto.Id = _enrollments.Any() ? _enrollments.Max(e => e.Id) + 1 : 1;
        enrollmentDto.Status = "Active";
        _enrollments.Add(enrollmentDto);
        return await Task.FromResult(true);
    }

    public async Task<bool> UpdateEnrollmentAsync(int enrollmentId, EnrollmentDto enrollmentDto)
    {
        var existing = _enrollments.FirstOrDefault(e => e.Id == enrollmentId);
        if (existing == null) return false;

        existing.UserId = enrollmentDto.UserId;
        existing.ActivityId = enrollmentDto.ActivityId;
        existing.EnrollmentDate = enrollmentDto.EnrollmentDate;
        existing.Status = enrollmentDto.Status;
        existing.ActivityName = enrollmentDto.ActivityName;

        return await Task.FromResult(true);
    }

    public async Task<bool> DeleteEnrollmentAsync(int enrollmentId)
    {
        var enrollment = _enrollments.FirstOrDefault(e => e.Id == enrollmentId);
        if (enrollment == null) return false;

        _enrollments.Remove(enrollment);
        return await Task.FromResult(true);
    }

    public async Task<bool> CancelEnrollmentAsync(int enrollmentId)
    {
        var enrollment = _enrollments.FirstOrDefault(e => e.Id == enrollmentId);
        if (enrollment == null) return false;

        enrollment.Status = "Cancelled";
        return await Task.FromResult(true);
    }
}