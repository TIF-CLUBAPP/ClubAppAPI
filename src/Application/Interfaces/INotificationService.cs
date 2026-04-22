using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetNotificationsByUserAsync(int userId);
    Task<bool> SendNotificationAsync(NotificationDto notificationDto);
    Task<bool> MarkAsReadAsync(int notificationId);
}