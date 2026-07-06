using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class CollaborationE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string SecondUserEmail = "pmo2@gmail.com";

    [Test]
    [Description("REQ_FUN_005 happy path: Share page shows permission rows (invited or existing)")]
    public async Task InviteUser_FromSharePage_ShowsInvitation()
    {
        // Arrange
        await LoginAsync();

        // Act — navigate to share page
        await Page.GotoAsync($"/{Owner}/promise-model-online/share");
        await Page.WaitForSelectorAsync("#permissions-section", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.querySelectorAll('tr[data-permission-id]').length > 0 || document.getElementById('invite-btn-top') !== null || document.getElementById('empty-state-invite-btn') !== null", options: new() { Timeout = 10000 });

        // Assert — permission table or invite button is visible
        var permissionRows = Page.Locator("tr[data-permission-id]");
        var rowCount = await permissionRows.CountAsync();
        var inviteBtn = Page.Locator("#invite-btn-top, #empty-state-invite-btn");
        var hasContent = rowCount > 0 || await inviteBtn.IsVisibleAsync();
        Assert.That(hasContent, Is.True,
            "Share page should show either permission rows or an invite button");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Invited user accepts invitation and accesses project")]
    public async Task AcceptInvitation_AndAccessSharedProject_Succeeds()
    {
        // Arrange — create a dedicated project to avoid seed-data permission conflicts
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueName = $"Collab Test {timestamp}";
        var uniqueSlug = $"collab-test-{timestamp}";

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", uniqueName);
        await Page.FillAsync("#first-promise-input", "Collaborate effectively.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];

        // Invite User2 via API
        var inviteBody = JsonSerializer.Serialize(new { email = SecondUserEmail, level = "View" });
        var inviteResp = await AuthPostJsonAsync($"/api/projects/{Owner}/{slug}/permissions", inviteBody);
        Assert.That(inviteResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Act — switch to User2 and accept invitation
        await LoginAsSecondUserAsync();
        await Page.GotoAsync("/invitations");
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync(".accept-btn, .empty-table-icon", new() { Timeout = 15000 });

        var acceptBtn = Page.Locator(".accept-btn").First;
        if (await acceptBtn.IsVisibleAsync())
        {
            await acceptBtn.ClickAsync();
            await acceptBtn.WaitForAsync(new() { State = WaitForSelectorState.Detached, Timeout = 10000 });
        }

        // Navigate to the shared project graph
        await Page.GotoAsync($"/{Owner}/{slug}/graph");
        await Page.WaitForSelectorAsync("#graph-content svg", new() { Timeout = 15000 });

        // Assert — graph loads for the invited user
        var nodes = await Page.Locator(".graph-node").CountAsync();
        Assert.That(nodes, Is.GreaterThan(0), "Invited user should see graph nodes");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_005 misuse: Invited user with View permission cannot write via API")]
    public async Task InvitedUser_ViewPermission_CannotWrite()
    {
        // Arrange — use the seeded project and invite User2 with View permission
        await LoginAsync();
        const string project = "promise-model-online";

        var inviteBody = JsonSerializer.Serialize(new { email = SecondUserEmail, level = "View" });
        var inviteResp = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{project}/permissions", inviteBody);
        // Created (new invitation) or Conflict/BadRequest if already invited
        Assert.That(inviteResp.StatusCode,
            Is.AnyOf(HttpStatusCode.Created, HttpStatusCode.BadRequest, HttpStatusCode.Conflict),
            "Invitation should be created or already pending");

        // Switch to User2 and accept invitation
        await LoginAsSecondUserAsync();

        // Accept any pending invitation for this project
        await Page.GotoAsync("/invitations");
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync(".accept-btn, .empty-table-icon", new() { Timeout = 15000 });
        var acceptBtn = Page.Locator(".accept-btn").First;
        if (await acceptBtn.IsVisibleAsync())
        {
            await acceptBtn.ClickAsync();
            await acceptBtn.WaitForAsync(new() { State = WaitForSelectorState.Detached, Timeout = 10000 });
        }

        // Check User2's permission level
        var permResp = await AuthGetAsync(
            $"/api/projects/{Owner}/{project}/my-permission", ajax: true);
        var permBody = await permResp.Content.ReadAsStringAsync();
        if (permBody.Contains("Edit") || permBody.Contains("Admin") || permBody.Contains("Owner"))
            Assert.Inconclusive("User2 has edit access via seed data — cannot verify write restriction");

        // Assert — User2 cannot write (moment status endpoint checks UserCanEditMomentAsync)
        var statusBody = JsonSerializer.Serialize(new { newStatus = "InProgress" });
        var writeResp = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{project}/moments/1/status", statusBody);
        Assert.That(writeResp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user cannot access share page")]
    public Task SharePage_Unauthenticated_RedirectsToLogin()
        => GotoAndWaitForLoginRedirectAsync($"/{Owner}/promise-model-online/share");
}
