using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IActivityService
{
    // Obtener todas las actividades (para mostrar en React)
    Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync();
    
    // Crear una nueva (el ABM que pidió el profe)
    Task<bool> CreateActivityAsync(ActivityDto activityDto);
    
    // Inscribir a un socio (Lógica de negocio)
    Task<bool> EnrollMemberAsync(int userId, int activityId);
}