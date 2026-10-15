using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<Notification>> GetMyNotificationsAsync(int userId);
    Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId);
    Task<Notification?> GetByIdAsync(int id);
    Task<Notification> CreateNotificationAsync(CreateNotificationDto dto);
    Task<Notification> NotifyAsync(int? userId, string title, string message, NotificationCategory category, string? referenceId = null);
    Task<string> UpdateNotificationAsync(int id, UpdateNotificationDto dto);
    Task<bool> DeleteNotificationAsync(int id);
    Task<string> MarkAsReadAsync(int notificationId, int loggedInUserId);
    Task MarkAllAsReadAsync(int userId);
}