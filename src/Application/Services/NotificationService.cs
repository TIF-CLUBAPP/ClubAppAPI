using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Services;

public class NotificationService : INotificationService
{
    private static List<NotificationDto> _notifications = new List<NotificationDto>();

    public async Task<IEnumerable<NotificationDto>> GetNotificationsByUserAsync(int userId)
    {
        return await Task.FromResult(_notifications.Where(n => n.User_id == userId));
    }

    public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync()
    {
        return await Task.FromResult(_notifications);
    }

    public async Task<NotificationDto?> GetNotificationByIdAsync(int notificationId)
    {
        return await Task.FromResult(_notifications.FirstOrDefault(n => n.Id == notificationId));
    }

    public async Task<bool> SendNotificationAsync(NotificationDto dto)
    {
        dto.Id = _notifications.Any() ? _notifications.Max(n => n.Id) + 1 : 1;
        dto.CreatedAt = DateTime.Now;
        dto.IsRead = false;
        _notifications.Add(dto);
        return await Task.FromResult(true);
    }

    public async Task<bool> UpdateNotificationAsync(int notificationId, NotificationDto dto)
    {
        var existing = _notifications.FirstOrDefault(n => n.Id == notificationId);
        if (existing == null) return false;

        existing.User_id = dto.User_id;
        existing.Title = dto.Title;
        existing.Message = dto.Message;
        existing.IsRead = dto.IsRead;
        // CreatedAt no se actualiza, queda la original

        return await Task.FromResult(true);
    }

    public async Task<bool> DeleteNotificationAsync(int notificationId)
    {
        var notification = _notifications.FirstOrDefault(n => n.Id == notificationId);
        if (notification == null)
        {
            return false;  // No existe
        }
        _notifications.Remove(notification);
        return true;
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = _notifications.FirstOrDefault(n => n.Id == id);
        if (notification == null) return false;

        notification.IsRead = true;
        return await Task.FromResult(true);
    }
}