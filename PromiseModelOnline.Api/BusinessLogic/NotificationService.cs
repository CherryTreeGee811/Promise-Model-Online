using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly IGenericMapper<Notification, NotificationDTO> _mapper;

        public NotificationService(
            INotificationRepository notificationRepo,
            IGenericMapper<Notification, NotificationDTO> mapper)
        {
            _notificationRepo = notificationRepo;
            _mapper = mapper;
        }

        public async Task<IEnumerable<NotificationDTO>> GetUnreadNotificationsAsync(int userId)
        {
            var notifications = await _notificationRepo.GetUnreadByUserIdAsync(userId);
            return notifications.Select(n => _mapper.Map(n, null!));
        }

        public async Task<IEnumerable<NotificationDTO>> GetAllNotificationsAsync(int userId)
        {
            var notifications = await _notificationRepo.GetAllByUserIdAsync(userId);
            return notifications.Select(n => _mapper.Map(n, null!));
        }

        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _notificationRepo.GetByIdAsync(notificationId);
            if (notification is null || notification.UserId != userId)
                throw new InvalidOperationException("Notification not found or access denied.");

            await _notificationRepo.MarkAsReadAsync(notificationId);
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _notificationRepo.MarkAllAsReadAsync(userId);
        }

        public async Task CreateNotificationAsync(int userId, NotificationType type, string message, string? link = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Message = message,
                Link = link,
                CreatedAt = DateTime.UtcNow
            };
            await _notificationRepo.AddAsync(notification);
            await _notificationRepo.SaveChangesAsync();
        }
    }
}