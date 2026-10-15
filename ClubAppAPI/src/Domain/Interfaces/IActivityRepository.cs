using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces;

public interface IActivityRepository : IRepositoryBase<Activity>
{
    /// <summary>Carga una actividad junto a sus horarios y profesor.</summary>
    Task<Activity?> GetWithSchedulesAsync(int id);

    /// <summary>Carga todas las actividades junto a sus horarios y profesor.</summary>
    Task<List<Activity>> GetAllWithSchedulesAsync();
}