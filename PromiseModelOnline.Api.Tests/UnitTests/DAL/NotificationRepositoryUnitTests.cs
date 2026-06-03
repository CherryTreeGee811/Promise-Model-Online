using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class NotificationRepositoryUnitTests : RepositoryTestBase
    {
        private NotificationRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new NotificationRepository(Context);
        }

        private async Task SeedAsync()
        {
            var notifications = new List<Notification>
            {
                new Notification { Id = 1, UserId = 10, IsRead = false, Message = "N1" },
                new Notification { Id = 2, UserId = 10, IsRead = true, Message = "N2" },
                new Notification { Id = 3, UserId = 20, IsRead = false, Message = "N3" },
                new Notification { Id = 4, UserId = 10, IsRead = false, Message = "N4" }
            };
            Context.Set<Notification>().AddRange(notifications);
            await Context.SaveChangesAsync();
        }

        [Test]
        public async Task GetUnreadByUserIdAsync_ReturnsOnlyUnreadForUser()
        {
            await SeedAsync();
            var result = await _repo.GetUnreadByUserIdAsync(10);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(n => n.UserId == 10 && !n.IsRead), Is.True);
        }

        [Test]
        public async Task GetAllByUserIdAsync_ReturnsAllForUser()
        {
            await SeedAsync();
            var result = await _repo.GetAllByUserIdAsync(10);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(3));
            Assert.That(list.All(n => n.UserId == 10), Is.True);
        }

        [Test]
        public async Task MarkAsReadAsync_ExistingNotification_SetsIsReadTrue()
        {
            await SeedAsync();
            await _repo.MarkAsReadAsync(1);

            var notification = await Context.Set<Notification>().FindAsync(1);
            Assert.That(notification!.IsRead, Is.True);
        }

        [Test]
        public async Task MarkAsReadAsync_NonExistingNotification_DoesNothing()
        {
            await SeedAsync();
            await _repo.MarkAsReadAsync(999);
            // No exception, just verify that existing notifications unchanged
            var notification = await Context.Set<Notification>().FindAsync(1);
            Assert.That(notification!.IsRead, Is.False);
        }

        [Test]
        public async Task MarkAllAsReadAsync_MarksAllUnreadForUser()
        {
            await SeedAsync();
            await _repo.MarkAllAsReadAsync(10);

            var unread = await Context.Set<Notification>()
                .Where(n => n.UserId == 10 && !n.IsRead)
                .ToListAsync();
            Assert.That(unread, Is.Empty);
            // User 20's unread should remain
            var otherUnread = await Context.Set<Notification>().Where(n => n.UserId == 20 && !n.IsRead).ToListAsync();
            Assert.That(otherUnread.Count, Is.EqualTo(1));
        }
    }
}