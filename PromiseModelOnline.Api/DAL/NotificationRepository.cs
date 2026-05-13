using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId)
            => await FindAsync(n => n.UserId == userId && !n.IsRead);

        public async Task<IEnumerable<Notification>> GetAllByUserIdAsync(int userId)
            => await FindAsync(n => n.UserId == userId);

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

        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await GetUnreadByUserIdAsync(userId);
            foreach (var n in unread) n.IsRead = true;
            await SaveChangesAsync();
        }
    }
}