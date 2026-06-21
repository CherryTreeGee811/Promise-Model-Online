using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="NotificationRepository"/> covering notification CRUD.</summary>
// Requirements: REQ_FUN_035
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
    public async Task REQ_FUN_035_GetUnreadByUserIdAsync_ReturnsOnlyUnreadForUser()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetUnreadByUserIdAsync(10);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.All(n => n.UserId == 10 && !n.IsRead), Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_GetAllByUserIdAsync_ReturnsAllForUser()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetAllByUserIdAsync(10);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(3));
        Assert.That(list.All(n => n.UserId == 10), Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_MarkAsReadAsync_ExistingNotification_SetsIsReadTrue()
    {
        // Arrange
        await SeedAsync();
        // Act
        await _repo.MarkAsReadAsync(1);

        // Assert
        var notification = await Context.Set<Notification>().FindAsync(1);
        Assert.That(notification!.IsRead, Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_MarkAsReadAsync_NonExistingNotification_DoesNothing()
    {
        // Arrange
        await SeedAsync();
        // Act
        await _repo.MarkAsReadAsync(999);
        // Assert
        // No exception, just verify that existing notifications unchanged
        var notification = await Context.Set<Notification>().FindAsync(1);
        Assert.That(notification!.IsRead, Is.False);
    }

    [Test]
    public async Task REQ_FUN_035_MarkAllAsReadAsync_MarksAllUnreadForUser()
    {
        // Arrange
        await SeedAsync();
        // Act
        await _repo.MarkAllAsReadAsync(10);

        // Assert
        var unread = await Context.Set<Notification>()
            .Where(n => n.UserId == 10 && !n.IsRead)
            .ToListAsync();
        Assert.That(unread, Is.Empty);
        // User 20's unread should remain
        var otherUnread = await Context.Set<Notification>().Where(n => n.UserId == 20 && !n.IsRead).ToListAsync();
        Assert.That(otherUnread.Count, Is.EqualTo(1));
    }
}
