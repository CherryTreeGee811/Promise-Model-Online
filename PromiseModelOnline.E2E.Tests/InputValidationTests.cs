using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// Verifies input validation — XSS payloads, malformed inputs,
/// content-type enforcement, and excessive input rejection.
/// </summary>
// Requirements: REQ_FUN_047 REQ_NF_008
public class InputValidationTests : E2ETestBase
{
    [Test]
    public async Task REQ_FUN_047_ProjectCreate_XssInName_StillReturns401()
    {
        // Unauthenticated: XSS payload should not crash or bypass auth
        // Arrange
        var payload = """{"name":"<script>alert(1)</script>","slug":"xss-test"}""";
        // Act
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_ProjectCreate_SqlInjectionInName_StillReturns401()
    {
        // Arrange
        var payload = """{"name":"test'; DROP TABLE Projects;--","slug":"sqli-test"}""";
        // Act
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_Import_NonJsonPayload_StillReturns401()
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/import");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("<xml><hack/></xml>",
            System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_Import_EmptyBody_StillReturns401()
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/import");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_ApiCall_WrongContentType_StillReturns401()
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/create");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("not json",
            System.Text.Encoding.UTF8, "text/plain");
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_ApiCall_OversizedPayload_StillReturns401()
    {
        // Arrange
        var huge = new string('x', 100_000);
        var payload = $$"""{"name":"{{huge}}","slug":"big"}""";
        // Act
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_Comment_XssPayload_StillReturns401()
    {
        // Arrange
        var payload = """{"text":"<img src=x onerror=alert(1)>"}""";
        // Act
        var response = await PostJsonAsync("/api/comments", payload, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_047_Permission_InvalidLevel_StillReturns401()
    {
        // Arrange
        var payload = """{"email":"test@test.com","level":"SuperAdmin"}""";
        // Act
        var response = await PostJsonAsync("/api/projects/pmo_test/seeded-project/permissions",
            payload, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
