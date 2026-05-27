using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces
{
    public interface IEnrollmentRepository : IRepositoryBase<Enrollment>
    {
        Task<int> GetCountByActivityIdAsync(int activityId);
    }
}