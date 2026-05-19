using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces;

public interface IEnrollmentRepository
{
    Task AddAsync(Enrollment enrollment);
    Task<Enrollment> GetByIdAsync(int id);
    Task UpdateAsync(Enrollment enrollment);
    Task DeleteAsync(int id);
    Task<int> GetCountByActivityIdAsync(int activityId);
    Task<IEnumerable<Enrollment>> GetAllAsync();
}

