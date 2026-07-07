using System.Net;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class CsrfE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_NF_008: CORS preflight from unauthorized origin must not return ACAO header")]
    public async Task CorsPreflight_UnauthorizedOrigin_NoAcaoHeader()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, $"/api/projects/{Owner}/{Project}/promises");
        request.Headers.Add("Origin", "https://evil.com");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await Client.SendAsync(request);

        // Assert — BFF proxy short-circuits unauthenticated OPTIONS with redirect to OIDC login,
        // so the API's CORS headers never reach the client. This prevents the browser from
        // approving a cross-origin preflight.
        Assert.That(response.Headers.Contains("Access-Control-Allow-Origin"), Is.False,
            "CORS preflight must not expose ACAO for unauthorized origins");
    }

    [Test]
    [Description("REQ_NF_008: CORS preflight from authorized origin returns ACAO header")]
    public async Task CorsPreflight_AuthorizedOrigin_ReturnsAcaoHeader()
    {
        // Arrange — authenticate to pass through BFF proxy
        await LoginAsync();
        var authClient = await GetAuthClientAsync();
        var request = new HttpRequestMessage(HttpMethod.Options,
            $"/api/projects/{Owner}/{Project}/promises");
        request.Headers.Add("Origin", "https://localhost:9000");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await authClient.SendAsync(request);

        // Assert — the API behind the BFF should recognize the allowed origin
        Assert.That(response.Headers.Contains("Access-Control-Allow-Origin"), Is.True,
            "CORS preflight from authorized origin should return ACAO");
    }

    [Test]
    [Description("REQ_NF_008: State-changing POST without session cookie returns 401")]
    public async Task StateChange_WithoutSessionCookie_Returns401()
    {
        // Arrange
        var json = """{"statement":"CSRF-test","displayOrder":1}""";
        var request = new HttpRequestMessage(HttpMethod.Post,
            $"/api/projects/{Owner}/{Project}/promises/create");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized),
            "State-changing POST without session cookie must return 401");
    }

    [Test]
    [Description("REQ_NF_008: SameSite=Lax on session cookie prevents cross-origin cookie attachment")]
    public async Task SessionCookie_HasSameSiteLax()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);

        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");

        // Assert
        Assert.That(session, Is.Not.Null, "Session cookie must be present after login");
        Assert.That(session.SameSite, Is.EqualTo(Microsoft.Playwright.SameSiteAttribute.Lax),
            "Session cookie must be SameSite=Lax for CSRF protection");
    }

    [Test]
    [Description("REQ_NF_008: Unauthenticated POST, PATCH, DELETE all return 401")]
    public async Task AllMutatingMethods_WithoutSession_Return401()
    {
        // Arrange
        var endpoints = new[]
        {
            (HttpMethod.Post, $"/api/projects/{Owner}/{Project}/promises/create",
                """{"statement":"test","displayOrder":1}"""),
            (HttpMethod.Patch, $"/api/projects/{Owner}/{Project}/promises/1/description",
                """{"description":"test"}"""),
            (HttpMethod.Delete, $"/api/projects/{Owner}/{Project}/promises/1",
                (string?)null),
        };

        foreach (var (method, path, body) in endpoints)
        {
            var request = new HttpRequestMessage(method, path);
            request.Headers.Add("X-Requested-With", "XMLHttpRequest");
            if (body is not null)
                request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

            // Act
            var response = await Client.SendAsync(request);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized),
                $"{method} {path} without session cookie must return 401");
        }
    }
}
