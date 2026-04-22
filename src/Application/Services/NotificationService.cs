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

    public async Task<bool> SendNotificationAsync(NotificationDto dto)
    {
        dto.Id = _notifications.Any() ? _notifications.Max(n => n.Id) + 1 : 1;
        dto.CreatedAt = DateTime.Now;
        dto.IsRead = false;
        _notifications.Add(dto);
        return await Task.FromResult(true);
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = _notifications.FirstOrDefault(n => n.Id == id);
        if (notification == null) return false;
        
        notification.IsRead = true;
        return await Task.FromResult(true);
    }
}