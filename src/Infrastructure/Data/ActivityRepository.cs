using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data;
using Infrastructure.Data;

namespace ClubApp.Infrastructure.Data;

public class ActivityRepository : RepositoryBase<Activity>, IActivityRepository 
{
    public ActivityRepository(ApplicationContext context) : base(context)
    {
        
    }
}
