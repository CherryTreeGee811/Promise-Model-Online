using System.Net;
using System.Text;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for API authorization boundaries — all unauthenticated requests rejected.</summary>
// Requirements: REQ_INT_002 REQ_INT_016
public class AuthorizationTests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_INT_002 misuse: Unauthenticated GET to API returns 401")]
    public async Task ApiRead_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync("/api/projects", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_INT_002 misuse: Unauthenticated POST to API returns 401")]
    public async Task ApiWrite_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { name = "test", slug = "test" });

        // Act
        var response = await PostJsonAsync("/api/projects/create", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_INT_002 misuse: Unauthenticated DELETE to API returns 401")]
    public async Task ApiDelete_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await DeleteAsync($"/api/projects/{Owner}/{Project}", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_INT_002 misuse: Unauthenticated PATCH to API returns 401")]
    public async Task ApiPatch_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { name = "hacked" });

        // Act
        var response = await PatchJsonAsync($"/api/projects/{Owner}/{Project}/details", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_INT_002 happy path: Authenticated user sees project graph content")]
    public async Task AuthenticatedRead_ShowsContent()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync("#graph-viewport", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Graph"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_INT_002 happy path: Authenticated API read returns 200")]
    public async Task AuthenticatedRead_BypassClient_Returns200()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/projects", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
