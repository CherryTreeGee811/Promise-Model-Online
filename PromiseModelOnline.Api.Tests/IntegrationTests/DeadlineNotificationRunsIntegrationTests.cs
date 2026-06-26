using System.Net;
using Microsoft.Extensions.DependencyInjection;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_038 REQ_SEC_LOG_001
public class DeadlineNotificationRunsIntegrationTests : ApiIntegrationTestBase
{
    [Test]
    [Description("REQ_FUN_038 happy path: Authenticated user triggers deadline notifications, returns 204 NoContent")]
    public async Task Create_AsOwner_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync("/api/deadline-notification-runs", new { });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_038 happy path: Non-owner with write scope triggers deadline notifications, returns 204 NoContent")]
    public async Task Create_NonOwner_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(NonOwnerToken);
        // Act
        var response = await PostAsync("/api/deadline-notification-runs", new { });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task Create_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync("/api/deadline-notification-runs", new { });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot trigger deadline notifications, returns 403")]
    public async Task Create_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync("/api/deadline-notification-runs", new { });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }
}
