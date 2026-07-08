using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_013 REQ_FUN_014 REQ_SEC_LOG_001
public class MyPermissionsIntegrationTests : ApiIntegrationTestBase
{
    [Test]
    [Description("REQ_FUN_013 happy path: Owner with no pending invitations returns empty list")]
    public async Task GetPendingInvitations_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/permissions/pending");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var invitations = await ReadJsonAsync<List<PendingInvitationDto>>(response);
        Assert.That(invitations, Is.Not.Null);
        Assert.That(invitations!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET pending returns 401")]
    public async Task GetPendingInvitations_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/permissions/pending");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH permission returns 401")]
    public async Task UpdatePermissionStatus_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync("/api/permissions/1",
            new { status = "Active" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_014 misuse: Null request body returns 400")]
    public async Task UpdatePermissionStatus_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync("/api/permissions/1", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }
}
