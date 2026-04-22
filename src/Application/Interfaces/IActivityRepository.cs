using ClubApp.Domain.Entities;

namespace ClubApp.Application.Interfaces;

public interface IActivityRepository // No usar .
{
    Task<IEnumerable<Activity>> GetAllAsync();
    Task<Activity?> GetByIdAsync(int id);
    Task AddAsync(Activity activity);
    Task UpdateAsync(Activity activity);
    Task DeleteAsync(int id);
    
    // Este método lo usamos en el servicio para contar inscritos
    Task<int> GetCurrentEnrollmentsCountAsync(int activityId);
}

//entidad, controller, servicio