using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IEnrollmentService
{
    Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync();
    Task<bool> CreateEnrollmentAsync(EnrollmentDto enrollmentDto);
    Task<bool> CancelEnrollmentAsync(int enrollmentId);
}