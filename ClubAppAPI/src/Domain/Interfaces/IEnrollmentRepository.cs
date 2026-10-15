using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces
{
    public interface IEnrollmentRepository : IRepositoryBase<Enrollment>
    {
        Task<int> GetCountByActivityIdAsync(int activityId);

        /// <summary>Cantidad de inscripciones ACTIVAS de una actividad (cupos realmente ocupados).</summary>
        Task<int> GetActiveCountByActivityIdAsync(int activityId);
    }
}