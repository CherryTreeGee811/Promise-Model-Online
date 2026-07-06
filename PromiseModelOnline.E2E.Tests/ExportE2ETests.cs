using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for project and user data export via UI download buttons.</summary>
// Requirements: REQ_FUN_009 REQ_SEC_LOG_001
public class ExportE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_009 happy path: Authenticated user exports project via settings page button")]
    public async Task ExportProject_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/settings");
        await Page.WaitForSelectorAsync("#export-project-btn", new() { Timeout = 15000 });
        var download = await Page.RunAndWaitForDownloadAsync(async () =>
        {
            await Page.ClickAsync("#export-project-btn");
        });

        // Assert
        Assert.That(download.SuggestedFilename, Does.Contain(".json").Or.Contain("export"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from settings")]
    // Act & Assert
    public Task ExportProject_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/settings");

    [Test]
    [Description("REQ_FUN_009 happy path: Authenticated user exports their data via API bypass")]
    public async Task ExportUserData_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/users/me/export");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "";

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(contentType, Does.Contain("json").Or.Contain("octet-stream"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from account page")]
    // Act & Assert
    public Task ExportUserData_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync("/account/delete");

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated export API returns 401")]
    public async Task ExportUserData_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/api/users/me/export", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
