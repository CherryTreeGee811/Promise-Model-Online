using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// Verifies authorization boundaries — no privilege escalation,
/// unauthenticated requests rejected, authenticated writes enforced.
/// </summary>
// Requirements: REQ_INT_002 REQ_INT_016
public class AuthorizationTests : E2ETestBase
{
    [Test]
    public async Task REQ_INT_002_ApiRead_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/api/projects", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiWrite_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/projects/create",
            """{"name":"evil","slug":"evil"}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiDelete_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await DeleteAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiPatch_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PatchJsonAsync("/api/projects/pmo_test/seeded-project/details",
            """{"name":"hacked"}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiImport_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/projects/import",
            """{"project":{"name":"test"}}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiComment_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/comments",
            """{"text":"spam"}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiPermissions_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/projects/pmo_test/seeded-project/permissions",
            """{"email":"evil@evil.com","level":"Edit"}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiNotificationPatch_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PatchJsonAsync("/api/notifications/1", """{"isRead":true}""", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiWebForm_Unauthenticated_ReturnsRedirect()
    {
        // Non-AJAX requests should redirect to login, not expose data
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/api/projects");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_INT_002_ApiWrite_WebForm_Unauthenticated_ReturnsRedirect()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/projects/create",
            """{"name":"evil","slug":"evil"}""");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
