using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// Verifies input validation — XSS payloads, malformed inputs,
/// content-type enforcement, and excessive input rejection.
/// </summary>
public class InputValidationTests : E2ETestBase
{
    [Test]
    public async Task ProjectCreate_XssInName_StillReturns401()
    {
        // Unauthenticated: XSS payload should not crash or bypass auth
        var payload = """{"name":"<script>alert(1)</script>","slug":"xss-test"}""";
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ProjectCreate_SqlInjectionInName_StillReturns401()
    {
        var payload = """{"name":"test'; DROP TABLE Projects;--","slug":"sqli-test"}""";
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Import_NonJsonPayload_StillReturns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/import");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("<xml><hack/></xml>",
            System.Text.Encoding.UTF8, "application/json");
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Import_EmptyBody_StillReturns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/import");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("", System.Text.Encoding.UTF8, "application/json");
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiCall_WrongContentType_StillReturns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects/create");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("not json",
            System.Text.Encoding.UTF8, "text/plain");
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiCall_OversizedPayload_StillReturns401()
    {
        var huge = new string('x', 100_000);
        var payload = $$"""{"name":"{{huge}}","slug":"big"}""";
        var response = await PostJsonAsync("/api/projects/create", payload, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Comment_XssPayload_StillReturns401()
    {
        var payload = """{"text":"<img src=x onerror=alert(1)>"}""";
        var response = await PostJsonAsync("/api/comments", payload, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Permission_InvalidLevel_StillReturns401()
    {
        var payload = """{"email":"test@test.com","level":"SuperAdmin"}""";
        var response = await PostJsonAsync("/api/projects/pmo_test/seeded-project/permissions",
            payload, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
