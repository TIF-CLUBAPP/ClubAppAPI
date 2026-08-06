using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IEnrollmentService
{
    Task<IEnumerable<Enrollment>> GetAllEnrollmentsAsync();
    Task<Enrollment?> GetEnrollmentByIdAsync(int id);
    Task<string> CreateEnrollmentAsync(int userId, CreateEnrollmentDto dto);
    Task<string> CancelEnrollmentAsync(int enrollmentId, int loggedInUserId, string loggedInUserRole); 
}