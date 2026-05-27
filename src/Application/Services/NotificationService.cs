using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions;

namespace ClubApp.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync()
        {
            var notifications = await _notificationRepository.GetAllAsync();
            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                User_id = n.User_id,
                Title = n.Title,
                Message = n.Message,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead
            }).ToList();
        }

        public async Task<IEnumerable<NotificationDto>> GetNotificationsByUserAsync(int userId)
        {
            var notifications = (await _notificationRepository.GetAllAsync())
                .Where(n => n.User_id == userId);

            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                User_id = n.User_id,
                Title = n.Title,
                Message = n.Message,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead
            }).ToList();
        }

        public async Task<NotificationDto> GetNotificationByIdAsync(int notificationId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            
            // REGLA: Si no se encuentra, tiramos tu 404 dinámico instantáneo
            if (notification == null)
            {
                throw new NotFoundException("Notification", notificationId);
            }

            return new NotificationDto
            {
                Id = notification.Id,
                User_id = notification.User_id,
                Title = notification.Title,
                Message = notification.Message,
                CreatedAt = notification.CreatedAt,
                IsRead = notification.IsRead
            };
        }

        public async Task<bool> SendNotificationAsync(NotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            {
                throw new AppValidationException("No se puede enviar una notificación con el título o el cuerpo vacío.");
            }

            var newNotification = new Notification
            {
                User_id = dto.User_id,
                Title = dto.Title,
                Message = dto.Message,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            await _notificationRepository.AddAsync(newNotification);
            return true;
        }

        public async Task<bool> UpdateNotificationAsync(int notificationId, NotificationDto dto)
        {
            var existing = await _notificationRepository.GetByIdAsync(notificationId);
            if (existing == null)
            {
                throw new NotFoundException("Notification", notificationId);
            }

            existing.Title = dto.Title;
            existing.Message = dto.Message;
            existing.IsRead = dto.IsRead;

            await _notificationRepository.UpdateAsync(existing);
            return true;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            if (notification == null)
            {
                throw new NotFoundException("Notification", notificationId);
            }

            await _notificationRepository.DeleteAsync(notificationId);
            return true;
        }

        public async Task<bool> MarkAsReadAsync(int notificationId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            if (notification == null)
            {
                throw new NotFoundException("Notification", notificationId);
            }
            if (notification.IsRead)
            {
                throw new AppValidationException("La notificación seleccionada ya fue leída.");
            }

            notification.IsRead = true;
            await _notificationRepository.UpdateAsync(notification);
            return true;
        }
    }
}