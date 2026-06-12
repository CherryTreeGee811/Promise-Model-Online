using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
<<<<<<< HEAD
using PromiseModelOnline.Api.Hubs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using Microsoft.AspNetCore.SignalR;
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
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            INotificationRepository notificationRepo,
            IGenericMapper<Notification, NotificationDTO> mapper,
            IHubContext<NotificationHub> hubContext)
        {
            _notificationRepo = notificationRepo;
            _mapper = mapper;
            _hubContext = hubContext;
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

            var dto = _mapper.Map(notification, null!);
            await _hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", dto);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
        }
    }
}