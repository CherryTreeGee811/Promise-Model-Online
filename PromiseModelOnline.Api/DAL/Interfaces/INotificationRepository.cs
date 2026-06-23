using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Notification"/> entities with read-state queries.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with per-user filtering and bulk read-state
///   management for the notification UI. Scoped lifetime.
/// </remarks>
public interface INotificationRepository : IGenericRepository<Notification>
{
    /// <summary>Return a user's unread notifications.</summary>
    /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
    /// <returns>Unread notifications for the user.</returns>
    Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId);

    /// <summary>Return all notifications (read and unread) for a user.</summary>
    /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
    /// <returns>Every notification for the user.</returns>
    Task<IEnumerable<Notification>> GetAllByUserIdAsync(int userId);

    /// <summary>Mark a single notification as read.</summary>
    /// <param name="notificationId">The notification to mark. Must be greater than zero.
    ///   No-op if the notification does not exist.</param>
    Task MarkAsReadAsync(int notificationId);

    /// <summary>Mark all of a user's unread notifications as read.</summary>
    /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
    Task MarkAllAsReadAsync(int userId);
}
