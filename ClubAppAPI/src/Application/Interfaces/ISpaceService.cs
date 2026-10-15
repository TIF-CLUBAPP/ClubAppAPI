using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface ISpaceService
{
    Task<List<SpaceDto>> GetAllAsync();
    Task<SpaceDto?> GetByIdAsync(int id);
    Task<SpaceDto> CreateAsync(SaveSpaceRequest dto);
    Task<SpaceDto?> UpdateAsync(int id, SaveSpaceRequest dto);
    Task<bool> DeleteAsync(int id);

    /// <summary>Turnos bloqueados de un espacio por clases/actividades del club.</summary>
    Task<List<BlockedSlotDto>> GetBlockedSlotsAsync(int spaceId, DateTime date);
}
