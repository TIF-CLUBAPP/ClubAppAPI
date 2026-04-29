using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IEnrollmentService
{
    Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync();
    Task<bool> CreateEnrollmentAsync(EnrollmentDto enrollmentDto);
    Task<bool> UpdateEnrollmentAsync(int enrollmentId, EnrollmentDto enrollmentDto);  
    Task<bool> DeleteEnrollmentAsync(int enrollmentId); 
    Task<bool> CancelEnrollmentAsync(int enrollmentId);
}