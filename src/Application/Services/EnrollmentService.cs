using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;

namespace ClubApp.Application.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly IEnrollmentRepository _enrollmentRepository;

    public EnrollmentService(IEnrollmentRepository enrollmentRepository)
    {
        _enrollmentRepository = enrollmentRepository;
    }

    public async Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync()
    {
        var enrollments = await _enrollmentRepository.GetAllAsync();
        return enrollments.Select(e => new EnrollmentDto
        {
            Id = e.Id,
            UserId = e.UserId,
            ActivityId = e.ActivityId,
            EnrollmentDate = e.EnrollmentDate,
            Status = e.Status.ToString()
        });
    }

    public async Task<bool> CreateEnrollmentAsync(EnrollmentDto enrollmentDto)
    {
        var newEnrollment = new Enrollment
        {
            UserId = enrollmentDto.UserId,
            ActivityId = enrollmentDto.ActivityId,
            EnrollmentDate = enrollmentDto.EnrollmentDate,
            Status = EnrollmentStatus.Active
        };

        await _enrollmentRepository.AddAsync(newEnrollment);
        return true;
    }

    public async Task<bool> UpdateEnrollmentAsync(int enrollmentId, EnrollmentDto enrollmentDto)
    {
        var existing = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (existing == null) return false;

        existing.UserId = enrollmentDto.UserId;
        existing.ActivityId = enrollmentDto.ActivityId;
        existing.EnrollmentDate = enrollmentDto.EnrollmentDate;
        existing.Status = Enum.TryParse<EnrollmentStatus>(enrollmentDto.Status, out var status)
            ? status
            : EnrollmentStatus.Active;

        await _enrollmentRepository.UpdateAsync(existing);
        return true;
    }

    public async Task<bool> DeleteEnrollmentAsync(int enrollmentId)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (enrollment == null) return false;

        await _enrollmentRepository.DeleteAsync(enrollmentId);
        return true;
    }

    public async Task<bool> CancelEnrollmentAsync(int enrollmentId)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (enrollment == null) return false;

        enrollment.Status = EnrollmentStatus.Cancelled;
        await _enrollmentRepository.UpdateAsync(enrollment);
        return true;
    }
}
