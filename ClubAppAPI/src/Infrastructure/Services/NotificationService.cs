using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationContext _context;

    public NotificationService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Notification>> GetMyNotificationsAsync(int userId)
    {
        return await _context.Notifications
                    .Where(n => n.UserId == userId || n.UserId == null)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId)
    {
        return await _context.Notifications
                    .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync();
    }

    public async Task<Notification?> GetByIdAsync(int id)
    {
        return await _context.Notifications.FindAsync(id);
    }

    public async Task<Notification> CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = new Notification
        {
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            SentAt = DateTime.UtcNow,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        
        return notification;
    }

    public async Task<string> UpdateNotificationAsync(int id, UpdateNotificationDto dto)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return "NOT_FOUND";

        notification.Title = dto.Title;
        notification.Message = dto.Message;

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<bool> DeleteNotificationAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> MarkAsReadAsync(int notificationId, int loggedInUserId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null) return "NOT_FOUND";
        
        if (notification.UserId != null && notification.UserId != loggedInUserId) 
            return "NOT_AUTHORIZED";

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return "OK";
    }
}