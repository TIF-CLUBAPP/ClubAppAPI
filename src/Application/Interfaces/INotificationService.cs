using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync();
    Task<IEnumerable<NotificationDto>> GetNotificationsByUserAsync(int userId);
    Task<NotificationDto?> GetNotificationByIdAsync(int notificationId);  
    Task<bool> SendNotificationAsync(NotificationDto notificationDto);
    Task<bool> UpdateNotificationAsync(int notificationId, NotificationDto notificationDto);  
    Task<bool> DeleteNotificationAsync(int notificationId);  
    Task<bool> MarkAsReadAsync(int notificationId);
}