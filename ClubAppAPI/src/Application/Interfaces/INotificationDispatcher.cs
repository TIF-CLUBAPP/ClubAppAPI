using ClubApp.Domain.Entities;

namespace ClubApp.Application.Interfaces;

public interface INotificationDispatcher
{
    Task SendNotificationAsync(Notification notification);
}
