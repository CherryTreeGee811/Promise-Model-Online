using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_035 REQ_SEC_LOG_001 REQ_SYS_030
public class NotificationsIntegrationTests : ApiIntegrationTestBase
{
    private async Task<Notification> SeedNotificationAsync(bool isRead = false)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var notification = new Notification
        {
            UserId = TestUserId,
            Type = NotificationType.Mention,
            Message = "Test notification",
            IsRead = isRead,
            CreatedAt = DateTime.UtcNow,
        };
        db.Set<Notification>().Add(notification);
        await db.SaveChangesAsync();
        return notification;
    }

    [Test]
    [Description("REQ_FUN_035 happy path: Authenticated user retrieves unread notifications, returns 200 OK with empty list")]
    public async Task GetNotifications_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/notifications");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var notifications = await ReadJsonAsync<List<NotificationDto>>(response);
        Assert.That(notifications, Is.Not.Null);
        Assert.That(notifications!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetNotifications_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/notifications");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_035 happy path: Authenticated user marks a single notification as read, returns 204 NoContent")]
    public async Task MarkRead_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedNotificationAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/notifications/{seeded.Id}",
            new { isRead = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH single notification returns 401")]
    public async Task MarkRead_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync("/api/notifications/1",
            new { isRead = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on single notification update returns 400")]
    public async Task MarkRead_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync("/api/notifications/1", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_035 happy path: Authenticated user marks all notifications as read, returns 204 NoContent")]
    public async Task BulkMarkRead_AsOwner_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync("/api/notifications",
            new { isRead = true, applyToAll = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH bulk notifications returns 401")]
    public async Task BulkMarkRead_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync("/api/notifications",
            new { isRead = true, applyToAll = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on bulk notification update returns 400")]
    public async Task BulkMarkRead_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync("/api/notifications", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }
}
