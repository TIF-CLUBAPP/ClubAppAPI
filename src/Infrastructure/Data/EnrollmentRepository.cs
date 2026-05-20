using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Data
{
    public class EnrollmentRepository : RepositoryBase<Enrollment>, IEnrollmentRepository
    {
        public EnrollmentRepository(ApplicationContext context) : base(context)
        {
        }

        // Usamos el '_context' que heredamos automáticamente de RepositoryBase
        public async Task<int> GetCountByActivityIdAsync(int activityId)
        {
            return await _context.Enrollments.CountAsync(e => e.ActivityId == activityId);
        }
    }
}