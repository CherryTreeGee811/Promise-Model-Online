using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
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
    /// <summary>Business logic for <see cref="Notification"/> entities with SignalR push.</summary>
    /// <remarks>
    ///   Provides user-scoped notification queries, read-state management, and creation with
    ///   real-time delivery via <see cref="NotificationHub"/> / SignalR. Scoped lifetime.
    /// </remarks>
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly IGenericMapper<Notification, NotificationDto> _mapper;
        private readonly IHubContext<NotificationHub> _hubContext;

        /// <summary>Initializes the service with required dependencies.</summary>
        /// <param name="notificationRepo">Repository for notification data access.</param>
        /// <param name="mapper">Mapper for notification to DTO conversion.</param>
        /// <param name="hubContext">SignalR hub context for real-time delivery.</param>
        public NotificationService(
            INotificationRepository notificationRepo,
            IGenericMapper<Notification, NotificationDto> mapper,
            IHubContext<NotificationHub> hubContext)
        {
            _notificationRepo = notificationRepo;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        /// <summary>Return a user's unread notifications as DTOs.</summary>
        /// <param name="userId">The recipient's user ID.</param>
        /// <returns>Unread notification DTOs.</returns>
        public async Task<IEnumerable<NotificationDto>> GetUnreadNotificationsAsync(int userId)
        {
            var notifications = await _notificationRepo.GetUnreadByUserIdAsync(userId);
            return notifications.Select(n => _mapper.Map(n, null!));
        }

        /// <summary>Return all notifications (read and unread) for a user as DTOs.</summary>
        /// <param name="userId">The recipient's user ID.</param>
        /// <returns>All notification DTOs for the user.</returns>
        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(int userId)
        {
            var notifications = await _notificationRepo.GetAllByUserIdAsync(userId);
            return notifications.Select(n => _mapper.Map(n, null!));
        }

        /// <summary>Mark a notification as read with user ownership validation.</summary>
        /// <param name="notificationId">The notification ID.</param>
        /// <param name="userId">The recipient's user ID for authorization.</param>
        /// <exception cref="InvalidOperationException">Notification not found or access denied.</exception>
        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _notificationRepo.GetByIdAsync(notificationId);
            if (notification is null || notification.UserId != userId)
                throw new InvalidOperationException("Notification not found or access denied.");

            await _notificationRepo.MarkAsReadAsync(notificationId);
        }

        /// <summary>Mark all of a user's unread notifications as read.</summary>
        /// <param name="userId">The recipient's user ID.</param>
        public async Task MarkAllAsReadAsync(int userId)
        {
            await _notificationRepo.MarkAllAsReadAsync(userId);
        }

        /// <summary>Create a notification and deliver it in real-time via SignalR.</summary>
        /// <param name="userId">The recipient's user ID.</param>
        /// <param name="type">The notification type.</param>
        /// <param name="message">The notification message.</param>
        /// <param name="link">Optional navigation link.</param>
        /// <remarks>
        ///   Persists the notification and sends it to the recipient's SignalR group
        ///   (<c>"user-{userId}"</c>) as a <c>ReceiveNotification</c> event.
        /// </remarks>
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
        }
    }
}