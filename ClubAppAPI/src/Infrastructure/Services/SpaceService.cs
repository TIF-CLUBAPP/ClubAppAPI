using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class SpaceService : ISpaceService
{
    private readonly ApplicationContext _context;

    public SpaceService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<List<SpaceDto>> GetAllAsync()
    {
        var spaces = await _context.Spaces
            .OrderBy(s => s.Name)
            .ToListAsync();

        return spaces.Select(Map).ToList();
    }

    public async Task<SpaceDto?> GetByIdAsync(int id)
    {
        var space = await _context.Spaces.FindAsync(id);
        return space == null ? null : Map(space);
    }

    public async Task<SpaceDto> CreateAsync(SaveSpaceRequest dto)
    {
        Validate(dto);

        var space = new Space
        {
            Name = dto.Name.Trim(),
            SportCategory = dto.SportCategory?.Trim() ?? string.Empty,
            Location = dto.Location?.Trim() ?? string.Empty,
            IsActive = dto.IsActive,
            AllowReservationsDuringClasses = dto.AllowReservationsDuringClasses,
            CreatedAt = DateTime.UtcNow
        };

        _context.Spaces.Add(space);
        await _context.SaveChangesAsync();

        return Map(space);
    }

    public async Task<SpaceDto?> UpdateAsync(int id, SaveSpaceRequest dto)
    {
        var space = await _context.Spaces.FindAsync(id);
        if (space == null) throw new NotFoundException("Space", id);

        Validate(dto);

        space.Name = dto.Name.Trim();
        space.SportCategory = dto.SportCategory?.Trim() ?? string.Empty;
        space.Location = dto.Location?.Trim() ?? string.Empty;
        space.IsActive = dto.IsActive;
        space.AllowReservationsDuringClasses = dto.AllowReservationsDuringClasses;

        await _context.SaveChangesAsync();

        return Map(space);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var space = await _context.Spaces.FindAsync(id);
        if (space == null) throw new NotFoundException("Space", id);

        _context.Spaces.Remove(space);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<BlockedSlotDto>> GetBlockedSlotsAsync(int spaceId, DateTime date)
    {
        var dayOfWeek = (int)date.DayOfWeek;

        var schedules = await _context.ActivitySchedules
            .Include(s => s.Activity)
            .Where(s => s.Activity.SpaceId == spaceId
                        && s.Activity.IsActive
                        && s.DayOfWeek == dayOfWeek)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return schedules.Select(s => new BlockedSlotDto
        {
            StartTime = date.Date.Add(s.StartTime),
            EndTime = date.Date.Add(s.EndTime),
            Reason = "Clase / Actividad del Club",
            ActivityName = s.Activity.Name,
            ActivityScheduleId = s.Id
        }).ToList();
    }

    private static void Validate(SaveSpaceRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new AppValidationException("El nombre del espacio es obligatorio.");
    }

    private static SpaceDto Map(Space s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        SportCategory = s.SportCategory,
        Location = s.Location,
        IsActive = s.IsActive,
        AllowReservationsDuringClasses = s.AllowReservationsDuringClasses
    };
}
