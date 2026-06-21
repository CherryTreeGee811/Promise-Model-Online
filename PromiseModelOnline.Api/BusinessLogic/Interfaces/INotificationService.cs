using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for Notification business logic with read-state management and creation.</summary>
/// <remarks>
///   Provides user-scoped notification queries, read/unread state management, and an internal
///   creation method used by other services to dispatch alerts. Scoped lifetime.
/// </remarks>
public interface INotificationService
{
    /// <summary>Return a user's unread notifications as DTOs.</summary>
    /// <param name="userId">The recipient's user ID.</param>
    /// <returns>Unread notification DTOs.</returns>
    Task<IEnumerable<NotificationDto>> GetUnreadNotificationsAsync(int userId);

    /// <summary>Return all notifications (read and unread) for a user as DTOs.</summary>
    /// <param name="userId">The recipient's user ID.</param>
    /// <returns>All notification DTOs for the user.</returns>
    Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(int userId);

    /// <summary>Mark a single notification as read, scoped to the user.</summary>
    /// <param name="notificationId">The notification ID to mark.</param>
    /// <param name="userId">The recipient's user ID for authorization.</param>
    Task MarkAsReadAsync(int notificationId, int userId);

    /// <summary>Mark all of a user's unread notifications as read.</summary>
    /// <param name="userId">The recipient's user ID.</param>
    Task MarkAllAsReadAsync(int userId);

    /// <summary>Create a notification. Used internally by other services.</summary>
    /// <param name="userId">The recipient's user ID.</param>
    /// <param name="type">The notification type.</param>
    /// <param name="message">The notification message text.</param>
    /// <param name="link">Optional navigation link.</param>
    Task CreateNotificationAsync(int userId, NotificationType type, string message, string? link = null);
}
