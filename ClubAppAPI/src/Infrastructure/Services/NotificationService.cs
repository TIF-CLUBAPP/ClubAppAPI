using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationContext _context;
    private readonly INotificationDispatcher? _dispatcher;

    public NotificationService(ApplicationContext context, INotificationDispatcher? dispatcher = null)
    {
        _context = context;
        _dispatcher = dispatcher;
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
        return await NotifyAsync(dto.UserId, dto.Title, dto.Message, dto.Category, dto.ReferenceId);
    }

    public async Task<Notification> NotifyAsync(int? userId, string title, string message, NotificationCategory category, string? referenceId = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Category = category,
            ReferenceId = referenceId,
            SentAt = DateTime.UtcNow,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();

        if (_dispatcher != null)
        {
            try
            {
                await _dispatcher.SendNotificationAsync(notification);
            }
            catch
            {
                // Best effort: si SignalR falla al emitir, la notificación ya quedó persistida en BD
            }
        }

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

    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId || n.UserId == null)
            .Where(n => !n.IsRead)
            .ToListAsync();

        foreach (var n in notifications)
            n.IsRead = true;

        await _context.SaveChangesAsync();
    }
}