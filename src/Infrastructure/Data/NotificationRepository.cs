using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data.Migrations;
using Infrastructure.Data;

namespace ClubApp.Infrastructure.Data;

public class NotificationRepository : RepositoryBase<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationContext context) : base(context)
    {
        
    }
}
