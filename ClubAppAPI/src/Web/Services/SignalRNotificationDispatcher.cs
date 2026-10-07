using ClubApp.API.Hubs;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace ClubApp.API.Services;

public class SignalRNotificationDispatcher : INotificationDispatcher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationDispatcher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        // Emitir con el formato plano esperado por el cliente
        var payload = new
        {
            id = notification.Id,
            userId = notification.UserId,
            title = notification.Title,
            message = notification.Message,
            category = notification.Category.ToString(),
            isRead = notification.IsRead,
            referenceId = notification.ReferenceId,
            createdAt = notification.CreatedAt,
            sentAt = notification.SentAt
        };

        if (notification.UserId.HasValue)
        {
            await _hubContext.Clients.Group($"user_{notification.UserId.Value}")
                .SendAsync("ReceiveNotification", payload);
        }
        else
        {
            await _hubContext.Clients.Group("global_notifications")
                .SendAsync("ReceiveNotification", payload);
        }
    }
}
