using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for cross-user authorization boundary enforcement.</summary>
// Requirements: REQ_NF_009
public class CrossUserAuthorizationTests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";
    private const string TargetProject = "/api/projects/pmo_test/promise-model-online";

    [Test]
    [Description("REQ_NF_009 misuse: Anonymous cannot access project API")]
    public async Task Anonymous_CannotAccess_BypassClient_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(TargetProject, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_NF_009 happy path: Project owner can view graph")]
    public async Task Owner_CanRead_OwnProject()
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
    [Description("REQ_NF_009 happy path: Authenticated user can list projects")]
    public async Task User_CanAccess_ProjectsList()
    {
        // Arrange
        await LoginAsSecondUserAsync();

        // Act
        await Page.GotoAsync("/projects");

        // Assert
        await Page.WaitForSelectorAsync("#project-list-table", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Projects"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_NF_009 happy path: User2 can list projects via API")]
    public async Task User2_CanRead_BypassClient_ReturnsOk()
    {
        // Arrange
        await LoginAsSecondUserAsync();

        // Act
        var response = await AuthGetAsync("/api/projects", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_NF_009 misuse: User2 cannot invite to User1's project")]
    public async Task User2_CannotInvite_ToUser1Project_BypassClient_ReturnsDenied()
    {
        // Arrange
        await LoginAsSecondUserAsync();
        var body = System.Text.Json.JsonSerializer.Serialize(new { Email = "third@test.com", Level = "View", ProjectId = 0 });

        // Act
        var response = await AuthPostJsonAsync(TargetProject + "/permissions", body);

        // Assert
        Assert.That(response.StatusCode, Is.AnyOf(HttpStatusCode.BadRequest, HttpStatusCode.Forbidden, HttpStatusCode.NotFound));
    }
}
