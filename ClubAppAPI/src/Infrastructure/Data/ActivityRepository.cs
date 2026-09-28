using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Data;

public class ActivityRepository : RepositoryBase<Activity>, IActivityRepository 
{
    public ActivityRepository(ApplicationContext context) : base(context)
    {
        
    }

    public async Task<Activity?> GetWithSchedulesAsync(int id)
    {
        return await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Schedules)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<List<Activity>> GetAllWithSchedulesAsync()
    {
        return await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Schedules)
            .ToListAsync();
    }
}
