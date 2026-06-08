using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// Verifies authorization boundaries — no privilege escalation,
/// unauthenticated requests rejected, authenticated writes enforced.
/// </summary>
public class AuthorizationTests : E2ETestBase
{
    [Test]
    public async Task ApiRead_Unauthenticated_Returns401()
    {
        var response = await GetAsync("/api/projects", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiWrite_Unauthenticated_Returns401()
    {
        var response = await PostJsonAsync("/api/projects/create",
            """{"name":"evil","slug":"evil"}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiDelete_Unauthenticated_Returns401()
    {
        var response = await DeleteAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiPatch_Unauthenticated_Returns401()
    {
        var response = await PatchJsonAsync("/api/projects/pmo_test/seeded-project/details",
            """{"name":"hacked"}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiImport_Unauthenticated_Returns401()
    {
        var response = await PostJsonAsync("/api/projects/import",
            """{"project":{"name":"test"}}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiComment_Unauthenticated_Returns401()
    {
        var response = await PostJsonAsync("/api/comments",
            """{"text":"spam"}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiPermissions_Unauthenticated_Returns401()
    {
        var response = await PostJsonAsync("/api/projects/pmo_test/seeded-project/permissions",
            """{"email":"evil@evil.com","level":"Edit"}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiNotificationPatch_Unauthenticated_Returns401()
    {
        var response = await PatchJsonAsync("/api/notifications/1", """{"isRead":true}""", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiWebForm_Unauthenticated_ReturnsRedirect()
    {
        // Non-AJAX requests should redirect to login, not expose data
        var response = await GetAsync("/api/projects");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task ApiWrite_WebForm_Unauthenticated_ReturnsRedirect()
    {
        var response = await PostJsonAsync("/api/projects/create",
            """{"name":"evil","slug":"evil"}""");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
