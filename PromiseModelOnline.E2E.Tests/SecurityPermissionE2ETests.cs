using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class SecurityPermissionE2ETests : E2ETestBase
{
    private const string SecondUserEmail = "pmo2@gmail.com";

    /// <summary>Create a dedicated project and set up User2 with View permission.</summary>
    private async Task<string> SetupProjectWithViewUserAsync()
    {
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", $"SecTest {timestamp}");
        await Page.FillAsync("#first-promise-input", "Security test first promise.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];

        var inviteBody = JsonSerializer.Serialize(new { email = SecondUserEmail, level = "View" });
        var inviteResp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/permissions", inviteBody);
        Assert.That(inviteResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Accept invitation via API (more reliable than browser UI)
        await LoginAsSecondUserAsync();
        var pendingResp = await AuthGetAsync("/api/permissions/pending", ajax: true);
        Assert.That(pendingResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var pendingBody = await pendingResp.Content.ReadAsStringAsync();
        var pending = JsonDocument.Parse(pendingBody).RootElement;
        foreach (var inv in pending.EnumerateArray())
        {
            var projectName = inv.GetProperty("projectName").GetString();
            if (projectName != null && projectName.Contains($"SecTest {timestamp}"))
            {
                var permId = inv.GetProperty("permissionId").GetInt32();
                var acceptBody = JsonSerializer.Serialize(new { status = "Active" });
                var acceptResp = await AuthPatchJsonAsync($"/api/permissions/{permId}", acceptBody);
                Assert.That(acceptResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
                break;
            }
        }

        return slug;
    }

    [Test]
    [Description("REQ_SEC_001 misuse: View user gets 403 on promise create")]
    public async Task ViewUser_CannotCreatePromise()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { statement = "Test promise from View user", displayOrder = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/promises/create", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_002 misuse: View user gets 403 on epic create")]
    public async Task ViewUser_CannotCreateEpic()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { statement = "Test epic from View user", productPromiseId = 0, displayOrder = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/epics/create", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_003 misuse: View user gets 403 on journey create")]
    public async Task ViewUser_CannotCreateJourney()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { statement = "Test journey from View user", epicId = 0, displayOrder = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/journeys/create", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_004 misuse: View user gets 403 on flow create")]
    public async Task ViewUser_CannotCreateFlow()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { statement = "Test flow from View user", journeyId = 0, displayOrder = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/flows/create", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_005 misuse: View user gets 403 on moment create")]
    public async Task ViewUser_CannotCreateMoment()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { statement = "Test moment from View user", flowId = 0, type = "Story", displayOrder = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/moments/create", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_006 misuse: View user gets 403 on promise description update")]
    public async Task ViewUser_CannotUpdatePromiseDescription()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { description = "Hacked description from View user" });
        var resp = await AuthPatchJsonAsync($"/api/projects/pmo_test/{slug}/promises/1/description", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_007 misuse: View user gets 403 on project detail update")]
    public async Task ViewUser_CannotUpdateProjectDetails()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { name = "Hacked Name" });
        var resp = await AuthPatchJsonAsync($"/api/projects/pmo_test/{slug}/details", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_008 misuse: View user gets 403 on project delete")]
    public async Task ViewUser_CannotDeleteProject()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var resp = await AuthDeleteAsync($"/api/projects/pmo_test/{slug}");
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_009 misuse: View user gets 403 on iteration create")]
    public async Task ViewUser_CannotCreateIteration()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { name = "Hacked iteration", id = 0, projectId = 0 });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/iterations", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_010 misuse: View user gets 403 on stride create")]
    public async Task ViewUser_CannotCreateStride()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { name = "Hacked stride", iterationId = 1, startDate = "2025-01-01", endDate = "2025-01-14", durationDays = 14, isActive = true });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/strides", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_011 misuse: View user gets 403 on invite user")]
    public async Task ViewUser_CannotInviteOtherUser()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var body = JsonSerializer.Serialize(new { email = "pmo3@gmail.com", level = "View" });
        var resp = await AuthPostJsonAsync($"/api/projects/pmo_test/{slug}/permissions", body);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_012 happy path: View user can read project promises")]
    public async Task ViewUser_CanReadPromises()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var resp = await AuthGetAsync($"/api/projects/pmo_test/{slug}/promises", ajax: true);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SEC_013 happy path: View user can read project moments")]
    public async Task ViewUser_CanReadMoments()
    {
        var slug = await SetupProjectWithViewUserAsync();
        var resp = await AuthGetAsync($"/api/projects/pmo_test/{slug}/moments?flowSeq=1", ajax: true);
        Assert.That(resp.StatusCode, Is.AnyOf(HttpStatusCode.OK, HttpStatusCode.NotFound),
            "Moments endpoint should return 200 (with data) or 404 (empty project)");
    }

    [Test]
    [Description("REQ_SEC_014 misuse: Unauthenticated user gets 401 on write endpoint")]
    public async Task Unauthenticated_CannotCreatePromise()
    {
        var body = JsonSerializer.Serialize(new { statement = "Anonymous promise" });
        var resp = await PostJsonAsync($"/api/projects/pmo_test/promise-model-online/promises/create", body, ajax: true);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_015 misuse: Authenticated user without project permission gets 403 on read")]
    public async Task AuthenticatedUser_WithoutProjectPermission_CannotRead()
    {
        // Create a dedicated project as Owner
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", $"NoPerm {timestamp}");
        await Page.FillAsync("#first-promise-input", "No permission test.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];

        // Switch to User2 (no invitation sent — no permission on this project)
        await LoginAsSecondUserAsync();

        // ProjectDetailController.GetProjectPromises enforces read gating via UserCanReadProjectAsync.
        // Users without project permission get 403.
        var resp = await AuthGetAsync($"/api/projects/pmo_test/{slug}/promises", ajax: true);
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }
}
