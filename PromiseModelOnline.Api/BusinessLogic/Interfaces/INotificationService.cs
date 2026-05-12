using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDTO>> GetUnreadNotificationsAsync(int userId);
        Task<IEnumerable<NotificationDTO>> GetAllNotificationsAsync(int userId);
        Task MarkAsReadAsync(int notificationId, int userId);
        Task MarkAllAsReadAsync(int userId);

        /// <summary>
        /// Creates a notification. Used internally by other services.
        /// </summary>
        Task CreateNotificationAsync(int userId, NotificationType type, string message, string? link = null);
    }
}