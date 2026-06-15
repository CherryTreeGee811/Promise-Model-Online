using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>EF Core implementation of <see cref="INotificationRepository"/> for notification read-state management.</summary>
    /// <remarks>
    ///   Uses the base class <see cref="FindAsync"/> method for queries. All methods that modify
    ///   read state call <see cref="SaveChangesAsync"/> immediately. Scoped lifetime.
    /// </remarks>
    public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
    {
        /// <summary>Initializes the repository with the shared database context.</summary>
        /// <param name="context">The EF Core database context.</param>
        public NotificationRepository(PromiseModelOnlineContext context) : base(context) { }

        /// <summary>Return all unread notifications for a user.</summary>
        /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
        /// <returns>Unread notifications for the user.</returns>
        public async Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId)
            => await FindAsync(n => n.UserId == userId && !n.IsRead);

        /// <summary>Return all notifications (read and unread) for a user.</summary>
        /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
        /// <returns>Every notification for the user.</returns>
        public async Task<IEnumerable<Notification>> GetAllByUserIdAsync(int userId)
            => await FindAsync(n => n.UserId == userId);

        /// <summary>Mark a single notification as read by its ID.</summary>
        /// <param name="notificationId">The notification ID to mark. No-op if not found.</param>
        public async Task MarkAsReadAsync(int notificationId)
        {
            var notification = await GetByIdAsync(notificationId);
            if (notification is not null)
            {
                notification.IsRead = true;
                Update(notification);
                await SaveChangesAsync();
            }
        }

        /// <summary>Mark all of a user's unread notifications as read.</summary>
        /// <param name="userId">The recipient's user ID. Must be greater than zero.</param>
        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await GetUnreadByUserIdAsync(userId);
            foreach (var n in unread) n.IsRead = true;
            await SaveChangesAsync();
        }
    }
}
